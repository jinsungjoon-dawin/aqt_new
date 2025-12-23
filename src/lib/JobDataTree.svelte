<script>
    import { onMount, tick } from "svelte";
    import { rooturl } from "../aqtstore";

    // --- Data State ---
    let projects = [];
    let jobs = [];
    let allMessages = [];

    // Filter State
    let selectedProject = "";
    let selectedJob = "";
    let selectedMessageId = "";
    let filteredJobs = [];
    let filteredMessages = [];

    // Tree Structure State
    // treeData = [ { project..., isOpen, children: [ { job..., isOpen, children: [ { message... } ] } ] } ]
    let treeData = [];

    // Right Grid State
    let selectedNode = null; // { type: 'message', id: ... , name: ... }
    let gridData = [];
    let gridColumns = [];
    let isLoading = false;

    onMount(async () => {
        await loadMetadata();
        buildTree();
    });

    // --- Reactive Filters ---
    $: {
        filteredJobs = selectedProject
            ? jobs.filter((j) => j.projectId === selectedProject)
            : jobs;
        if (selectedJob && !filteredJobs.find((j) => j.id === selectedJob)) {
            selectedJob = "";
        }
    }

    $: {
        filteredMessages = selectedJob
            ? allMessages.filter((m) => m.jobId === selectedJob)
            : [];
        if (
            selectedMessageId &&
            !filteredMessages.find((m) => m.messageId === selectedMessageId)
        ) {
            selectedMessageId = "";
        }
    }

    async function loadMetadata() {
        try {
            // 프로젝트/업무 목록 로딩
            const pRes = await fetch($rooturl + "/common/project/list");
            projects = await pRes.json();

            const jRes = await fetch($rooturl + "/common/job/list");
            jobs = await jRes.json();

            // 전문 목록 로딩
            const mRes = await fetch($rooturl + "/jobs/message/list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            allMessages = await mRes.json();
        } catch (e) {
            console.error(e);
        }
    }

    function buildTree() {
        // Build hierarchy: Project -> Job -> Message
        treeData = projects.map((proj) => {
            const projJobs = jobs.filter((j) => j.projectId === proj.id);
            const jobNodes = projJobs.map((job) => {
                const jobMsgs = allMessages.filter((m) => m.jobId === job.id);
                return {
                    id: job.id,
                    name: job.name,
                    type: "job",
                    isOpen: false,
                    children: jobMsgs.map((msg) => ({
                        id: msg.messageId,
                        name: msg.messageNameKr || msg.messageNameEn,
                        type: "message",
                        projectId: proj.id,
                        jobId: job.id,
                    })),
                };
            });

            return {
                id: proj.id,
                name: proj.name,
                type: "project",
                isOpen: true, // Auto-open projects by default
                children: jobNodes,
            };
        });
    }

    // --- Actions ---

    async function handleSearch() {
        if (!selectedProject) {
            alert("최소한 프로젝트는 선택해주세요."); // UX choice, or just search all
            return;
        }

        // 1. Reset Tree State (Close all first? Optional)
        // Let's keep existing state unless we strictly want to focus on result.
        // For 'Search', we usually want to REVEAL the target.

        // 2. Find path to target
        let targetProjId = selectedProject;
        let targetJobId = selectedJob;
        let targetMsgId = selectedMessageId;

        // 3. Update Tree Data to Open Nodes
        treeData = treeData.map((proj) => {
            // Project Check
            if (targetProjId && proj.id !== targetProjId) {
                // If specific project selected and this is not it, maybe close or leave as is?
                // Let's leave as is to be less intrusive, or close if we want filter effect.
                // Assuming 'Focus' behavior:
                return proj;
            }

            let isOpenProj = proj.isOpen;
            if (targetProjId && proj.id === targetProjId) isOpenProj = true;

            const newChildren = proj.children.map((job) => {
                // Job Check
                if (targetJobId && job.id !== targetJobId) return job;

                let isOpenJob = job.isOpen;
                if (targetJobId && job.id === targetJobId) isOpenJob = true;

                // Message Check (Leaf node doesn't have isOpen, but we might want to select it)
                if (targetMsgId) {
                    const hasMsg = job.children.find(
                        (m) => m.id === targetMsgId,
                    );
                    if (hasMsg) isOpenJob = true; // Open job if message is inside
                }

                return { ...job, isOpen: isOpenJob };
            });

            return { ...proj, isOpen: isOpenProj, children: newChildren };
        });

        // 4. Force UI Update & Select Node
        await tick();
        if (targetMsgId) {
            // Find the node object to select
            for (const proj of treeData) {
                for (const job of proj.children) {
                    const msg = job.children.find((m) => m.id === targetMsgId);
                    if (msg) {
                        selectMessage(msg);
                        return; // Done
                    }
                }
            }
        } else if (targetJobId) {
            // Optional: Select Job Node if we had a job selection UI in tree
        }
    }

    function toggleNode(node) {
        node.isOpen = !node.isOpen;
        treeData = treeData; // Trigger reactivity
    }

    function selectMessage(node) {
        if (node.type !== "message") return;
        selectedNode = node;
        loadGridData(node);
    }

    async function loadGridData(node) {
        isLoading = true;
        try {
            const res = await fetch($rooturl + "/jobs/data/list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId: node.id }),
            });
            const data = await res.json();

            // Infer columns from dynamicData of the first row if available, or just empty
            // The backend sends `dynamicData` object.

            if (data.length > 0) {
                // Get all unique keys from all rows to ensure we show all columns
                const keys = new Set();
                data.forEach((row) => {
                    if (row.dynamicData) {
                        Object.keys(row.dynamicData).forEach((k) =>
                            keys.add(k),
                        );
                    }
                });
                gridColumns = Array.from(keys);
                gridData = data.map((row) => ({ ...row.dynamicData })); // Flatten for simple grid display
            } else {
                gridColumns = [];
                gridData = [];
            }
        } catch (error) {
            console.error(error);
            gridData = [];
            gridColumns = [];
        } finally {
            isLoading = false;
        }
    }
</script>

<div
    class="container mx-auto p-4 lg:p-8 bg-gray-50 flex flex-col h-[calc(100vh-4.1rem)] gap-4"
>
    <!-- Top Filter Section -->
    <div
        class="bg-white border border-gray-300 rounded shadow p-4 flex flex-wrap items-center gap-4"
    >
        <h2 class="text-xl font-bold text-gray-700 mr-2">전문 데이터 트리</h2>

        <!-- Project Select -->
        <div class="flex items-center">
            <span class="text-gray-700 font-semibold px-2 text-sm"
                >프로젝트</span
            >
            <select
                bind:value={selectedProject}
                class="border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-blue-500 min-w-[120px]"
            >
                <option value="">프로젝트 선택</option>
                {#each projects as project}
                    <option value={project.id}>{project.name}</option>
                {/each}
            </select>
        </div>

        <!-- Job Select -->
        <div class="flex items-center">
            <span class="text-gray-700 font-semibold px-2 text-sm">업무</span>
            <select
                bind:value={selectedJob}
                class="border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-blue-500 min-w-[120px]"
            >
                <option value="">업무 선택</option>
                {#each filteredJobs as job}
                    <option value={job.id}>{job.name}</option>
                {/each}
            </select>
        </div>

        <!-- Message Select -->
        <div class="flex items-center">
            <span class="text-gray-700 font-semibold px-2 text-sm">전문</span>
            <select
                bind:value={selectedMessageId}
                class="border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-blue-500 min-w-[150px]"
            >
                <option value="">전문 선택</option>
                {#each filteredMessages as msg}
                    <option value={msg.id}>{msg.name}</option>
                {/each}
            </select>
        </div>

        <button
            on:click={handleSearch}
            class="bg-white hover:bg-blue-50 text-blue-600 font-semibold hover:text-blue-700 px-4 py-1 text-sm rounded border border-blue-300 hover:border-blue-400 transition ml-auto"
        >
            조회
        </button>
    </div>

    <!-- Main Content: Tree & Grid -->
    <div class="flex-1 flex gap-4 overflow-hidden">
        <!-- Left Panel: Tree View (30%) -->
        <div
            class="w-[30%] bg-white border border-gray-300 rounded shadow flex flex-col"
        >
            <div class="p-3 border-b border-gray-200 bg-gray-100 font-bold">
                전문 목록
            </div>
            <div class="flex-1 overflow-auto p-2">
                {#each treeData as proj}
                    <!-- Level 1: Project -->
                    <div class="mb-1">
                        <div
                            class="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded"
                            on:click={() => toggleNode(proj)}
                        >
                            <span class="mr-2 text-gray-500">
                                {#if proj.isOpen}▼{:else}▶{/if}
                            </span>
                            <span class="font-semibold text-blue-700"
                                >📁 {proj.name}</span
                            >
                        </div>

                        {#if proj.isOpen}
                            <div class="ml-4 border-l border-gray-300 pl-2">
                                {#each proj.children as job}
                                    <!-- Level 2: Job -->
                                    <div class="mb-1">
                                        <div
                                            class="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded"
                                            on:click={() => toggleNode(job)}
                                        >
                                            <span class="mr-2 text-gray-500">
                                                {#if job.isOpen}▼{:else}▶{/if}
                                            </span>
                                            <span
                                                class="font-medium text-gray-700"
                                                >📂 {job.name}</span
                                            >
                                        </div>

                                        {#if job.isOpen}
                                            <div
                                                class="ml-4 border-l border-gray-300 pl-2"
                                            >
                                                {#each job.children as msg}
                                                    <!-- Level 3: Message (Leaf) -->
                                                    <div
                                                        class="flex items-center cursor-pointer p-1 rounded {selectedNode?.id ===
                                                        msg.id
                                                            ? 'bg-blue-100 text-blue-800 font-semibold'
                                                            : 'hover:bg-gray-100 text-gray-600'}"
                                                        on:click={() =>
                                                            selectMessage(msg)}
                                                    >
                                                        <span class="mr-2"
                                                            >📄</span
                                                        >
                                                        <span>{msg.name}</span>
                                                        <span
                                                            class="text-xs text-gray-400 ml-2"
                                                            >({msg.id})</span
                                                        >
                                                    </div>
                                                {/each}
                                                {#if job.children.length === 0}
                                                    <div
                                                        class="text-xs text-gray-400 italic p-1"
                                                    >
                                                        (전문 없음)
                                                    </div>
                                                {/if}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                                {#if proj.children.length === 0}
                                    <div
                                        class="text-xs text-gray-400 italic p-1"
                                    >
                                        (업무 없음)
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        <!-- Right Panel: Data Grid (70%) -->
        <div
            class="flex-1 bg-white border border-gray-300 rounded shadow flex flex-col"
        >
            <div
                class="p-3 border-b border-gray-200 bg-gray-100 font-bold flex justify-between items-center"
            >
                <span>
                    전문 등데이터
                    {#if selectedNode}
                        <span class="text-blue-600 ml-2"
                            >- {selectedNode.name} ({selectedNode.id})</span
                        >
                    {/if}
                </span>
                <div class="text-xs text-gray-500">
                    {#if selectedNode}
                        {gridData.length}건 조회됨
                    {/if}
                </div>
            </div>

            <div class="flex-1 overflow-auto p-0 relative">
                {#if !selectedNode}
                    <div
                        class="absolute inset-0 flex items-center justify-center text-gray-400"
                    >
                        좌측 트리에서 전문을 선택해주세요.
                    </div>
                {:else if isLoading}
                    <div
                        class="absolute inset-0 flex items-center justify-center text-blue-500"
                    >
                        데이터 로딩 중...
                    </div>
                {:else if gridData.length === 0}
                    <div
                        class="absolute inset-0 flex items-center justify-center text-gray-400"
                    >
                        데이터가 없습니다.
                    </div>
                {:else}
                    <table
                        class="min-w-full border-collapse text-sm whitespace-nowrap"
                    >
                        <thead
                            class="bg-gray-50 text-gray-700 sticky top-0 shadow"
                        >
                            <tr>
                                {#each gridColumns as col}
                                    <th
                                        class="border-b border-r border-gray-300 px-4 py-2 text-center"
                                        >{col}</th
                                    >
                                {/each}
                            </tr>
                        </thead>
                        <tbody>
                            {#each gridData as row, i}
                                <tr
                                    class="hover:bg-blue-50 transition border-b border-gray-200"
                                >
                                    {#each gridColumns as col}
                                        <td
                                            class="border-r border-gray-200 px-4 py-2 text-center"
                                            >{row[col]}</td
                                        >
                                    {/each}
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    /* Custom Scrollbar for Tree View */
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    ::-webkit-scrollbar-track {
        background: #f1f1f1;
    }
    ::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #bbb;
    }
</style>
