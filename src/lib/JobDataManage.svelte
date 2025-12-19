<script>
    import { onMount } from "svelte";
    import { read, utils, writeFile } from "xlsx";
    import { rooturl } from "../aqtstore";

    // 데이터 상태
    let projects = [];
    let jobs = [];
    let messages = []; // 전문 목록
    let dataList = []; // 그리드 데이터
    let dynamicColumns = []; // 동적 컬럼 목록
    let isLoading = false;

    // 필터 상태
    let selectedProject = "";
    let selectedJob = "";
    let selectedMessageId = "";
    let filteredJobs = [];
    let filteredMessages = [];

    onMount(async () => {
        try {
            const projectRes = await fetch(`${$rooturl}/jobs/project/list`);
            projects = await projectRes.json();

            const jobRes = await fetch(`${$rooturl}/jobs/job/list`);
            jobs = await jobRes.json();

            const msgRes = await fetch(`${$rooturl}/jobs/message/list`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            messages = await msgRes.json();
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        }
    });

    // 프로젝트 선택 -> 업무 목록 필터링
    $: {
        filteredJobs = selectedProject
            ? jobs.filter((j) => j.projectId === selectedProject)
            : jobs;
        // 프로젝트 변경 시 업무/전문 초기화
        if (selectedJob && !filteredJobs.find((j) => j.id === selectedJob)) {
            selectedJob = "";
        }
    }

    // 업무 선택 -> 전문 목록 필터링
    $: {
        filteredMessages = selectedJob
            ? messages.filter((m) => m.jobId === selectedJob)
            : [];
        // 업무 변경 시 전문 초기화
        if (
            selectedMessageId &&
            !filteredMessages.find((m) => m.messageId === selectedMessageId)
        ) {
            selectedMessageId = "";
        }
    }

    // 조회 함수
    async function handleSearch() {
        if (!selectedMessageId) {
            alert("조회할 전문을 선택해주세요.");
            return;
        }

        isLoading = true;
        try {
            const res = await fetch(`${$rooturl}/jobs/data/list`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId: selectedMessageId }),
            });
            const data = await res.json();

            // Clean/Transform data and infer columns
            if (data.length > 0) {
                const keys = new Set();
                // Infer columns from all rows
                data.forEach((row) => {
                    if (row.dynamicData) {
                        Object.keys(row.dynamicData).forEach((k) =>
                            keys.add(k),
                        );
                    }
                });
                dynamicColumns = Array.from(keys);

                // Map to internal format
                dataList = data.map((d) => ({
                    ...d,
                    isChecked: false,
                }));
            } else {
                dynamicColumns = [];
                dataList = [];
            }
        } catch (error) {
            console.error("데이터 조회 실패:", error);
            dataList = [];
        } finally {
            isLoading = false;
        }
    }

    // 추가
    function handleAdd() {
        if (!selectedMessageId) {
            alert("전문을 선택해주세요.");
            return;
        }
        if (dynamicColumns.length === 0) {
            // 컬럼 정보가 없으면 조회를 먼저 하도록 유도하거나 빈 컬럼으로 시작
            // 여기서는 임의로 컬럼이 없으면 'NewField' 하나 생성
            dynamicColumns = ["Field1"];
        }

        const newRow = {
            projectId: selectedProject,
            projectName:
                projects.find((p) => p.id === selectedProject)?.name || "",
            // jobGroupId: "GRP_" + selectedJob, // Should get from message or job metadata really
            jobGroupId:
                messages.find((m) => m.messageId === selectedMessageId)
                    ?.jobGroupId || "",
            jobName: jobs.find((j) => j.id === selectedJob)?.name || "",
            messageId: selectedMessageId,
            messageName:
                filteredMessages.find((m) => m.messageId === selectedMessageId)
                    ?.messageNameKr || "",
            isChecked: true,
            status: "N",
            dynamicData: {},
        };

        dynamicColumns.forEach((col) => {
            newRow.dynamicData[col] = "";
        });

        dataList = [...dataList, newRow];
    }

    // 삭제
    async function handleDelete() {
        const checked = dataList.filter((d) => d.isChecked);
        if (checked.length === 0) {
            alert("삭제할 항목을 선택해주세요.");
            return;
        }

        if (confirm(`${checked.length}건을 삭제하시겠습니까?`)) {
            // N -> 즉시 제거, R/U -> API Call
            const toRemove = new Set(checked.filter((d) => d.status === "N"));
            const toDelete = checked.filter((d) => d.status !== "N");

            try {
                if (toDelete.length > 0) {
                    await fetch(`${$rooturl}/jobs/data/delete`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(toDelete),
                    });
                }

                // Client-side update
                dataList = dataList.filter(
                    (d) => !toRemove.has(d) && !toDelete.includes(d),
                );
                alert("삭제되었습니다.");
            } catch (error) {
                console.error("삭제 실패:", error);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    }

    // 저장
    async function handleSave() {
        const target = dataList.filter(
            (d) => d.isChecked || d.status === "N" || d.status === "U",
        );
        // Only save N or U items? Or checking means explicit save intent?
        // Usually Save Action saves all dirty ('N', 'U') items or checked items.
        // Let's filter by N or U for optimization, but user might check R and expect save? (Not in this logic)
        // Let's stick to: Save items that are NEW or UPDATED.

        const dirtyItems = dataList.filter(
            (d) => d.status === "N" || d.status === "U" || d.isChecked,
        );
        // If the user checks an item, let's try to save it just in case.

        if (dirtyItems.length === 0) {
            alert("저장할 변경사항이 없습니다.");
            return;
        }

        try {
            const res = await fetch(`${$rooturl}/jobs/data/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dirtyItems),
            });
            const result = await res.json();
            alert(`${result.count}건을 저장했습니다.`);

            // Reload to get fresh state
            handleSearch();
        } catch (error) {
            console.error("저장 실패:", error);
            alert("저장 중 오류가 발생했습니다.");
        }
    }

    // 전체 선택
    let isAllChecked = false;
    function toggleAll(e) {
        const checked = e.target.checked;
        isAllChecked = checked;
        dataList = dataList.map((d) => ({ ...d, isChecked: checked }));
    }

    // 개별 체크 -> 전체 선택 상태 업데이트
    $: {
        if (dataList.length > 0) {
            isAllChecked = dataList.every((d) => d.isChecked);
        } else {
            isAllChecked = false;
        }
    }

    // 엑셀 관련 변수
    let fileInput;

    function handleExcelUploadTrigger() {
        if (!selectedMessageId) {
            alert("전문을 선택해주세요.");
            return;
        }
        fileInput.click();
    }

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                alert("엑셀 파일에 데이터가 없습니다.");
                fileInput.value = "";
                return;
            }

            // Fixed Keys to ignore when identifying dynamic columns
            // These match the keys used in handleExcelDownload
            const fixedKeys = new Set([
                "프로젝트 ID",
                "프로젝트명",
                "업무그룹 ID",
                "c_target_sys_c(업무명)",
                "전문 ID",
                "전문 Name",
                "__rowNum__",
            ]);

            // 1. Identify Dynamic Columns from Excel Headers
            const excelKeys = Object.keys(jsonData[0]);
            const newDynamicCols = excelKeys.filter((k) => !fixedKeys.has(k));

            // 2. Update dynamicColumns: Add any new columns found in Excel
            let updatedDynamicColumns = [...dynamicColumns];
            newDynamicCols.forEach((col) => {
                if (!updatedDynamicColumns.includes(col)) {
                    updatedDynamicColumns.push(col);
                }
            });
            dynamicColumns = updatedDynamicColumns;

            // 3. Map Excel rows to Data Objects
            const newRows = jsonData.map((row) => {
                const dynamicData = {};

                // Fill dynamic data (including new columns, default to empty if missing in row)
                dynamicColumns.forEach((col) => {
                    dynamicData[col] =
                        row[col] !== undefined ? String(row[col]) : "";
                });

                return {
                    projectId: selectedProject,
                    projectName:
                        projects.find((p) => p.id === selectedProject)?.name ||
                        "",
                    jobGroupId: "GRP_" + selectedJob,
                    jobName: jobs.find((j) => j.id === selectedJob)?.name || "",
                    messageId: selectedMessageId,
                    messageName:
                        filteredMessages.find((m) => m.id === selectedMessageId)
                            ?.name || "",
                    isChecked: true,
                    status: "N", // New status
                    dynamicData: dynamicData,
                };
            });

            // 4. Append to Table
            dataList = [...dataList, ...newRows];
            alert(`${newRows.length}건이 테이블에 추가되었습니다.`);
            fileInput.value = "";
        };
        reader.readAsArrayBuffer(file);
    }

    function handleExcelDownload() {
        if (dataList.length === 0) {
            alert("다운로드할 데이터가 없습니다.");
            return;
        }
        // Flatten data for export
        const exportData = dataList.map((row) => {
            const flat = {
                "프로젝트 ID": row.projectId,
                프로젝트명: row.projectName,
                "업무그룹 ID": row.jobGroupId,
                "c_target_sys_c(업무명)": row.jobName,
                "전문 ID": row.messageId,
                "전문 Name": row.messageName,
            };
            // Dynamic columns
            dynamicColumns.forEach((col) => {
                flat[col] = row.dynamicData[col];
            });
            return flat;
        });

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "JobData");
        writeFile(wb, "JobData.xlsx");
    }
</script>

<div
    class="container mx-auto p-4 lg:p-8 bg-gray-50 flex flex-col h-[calc(100vh-4.1rem)] gap-4"
>
    <!-- Top Pane: Filter & Actions -->
    <div class="bg-white border border-gray-300 rounded shadow overflow-hidden">
        <!-- Header Section -->
        <div
            class="p-4 border-b border-gray-200 bg-gray-100 flex flex-wrap justify-between items-center gap-2"
        >
            <h2 class="text-xl font-bold text-gray-700">전문 자료등록</h2>
            <div class="flex flex-wrap items-center gap-2">
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
                    <span class="text-gray-700 font-semibold px-2 text-sm"
                        >업무</span
                    >
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
                    <span class="text-gray-700 font-semibold px-2 text-sm"
                        >전문</span
                    >
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

                <div class="flex gap-1 ml-2">
                    <button
                        on:click={handleSearch}
                        class="bg-white hover:bg-blue-50 text-blue-600 font-semibold hover:text-blue-700 px-3 py-1 text-xs rounded border border-blue-300 hover:border-blue-400 transition"
                    >
                        조회
                    </button>
                    <button
                        on:click={handleAdd}
                        class="bg-white hover:bg-blue-50 text-blue-600 font-semibold hover:text-blue-700 px-3 py-1 text-xs rounded border border-blue-300 hover:border-blue-400 transition"
                    >
                        추가
                    </button>
                    <button
                        on:click={handleDelete}
                        class="bg-white hover:bg-red-50 text-red-600 font-semibold hover:text-red-700 px-3 py-1 text-xs rounded border border-red-300 hover:border-red-400 transition"
                    >
                        삭제
                    </button>
                    <button
                        on:click={handleSave}
                        class="bg-white hover:bg-blue-50 text-blue-600 font-semibold hover:text-blue-700 px-3 py-1 text-xs rounded border border-blue-300 hover:border-blue-400 transition"
                    >
                        저장
                    </button>
                    <div class="w-px h-6 bg-gray-300 mx-1"></div>
                    <button
                        on:click={handleExcelUploadTrigger}
                        class="bg-white hover:bg-green-50 text-green-600 font-semibold hover:text-green-700 px-3 py-1 text-xs rounded border border-green-300 hover:border-green-400 transition"
                    >
                        엑셀 업로드
                    </button>
                    <button
                        on:click={handleExcelDownload}
                        class="bg-white hover:bg-green-50 text-green-600 font-semibold hover:text-green-700 px-3 py-1 text-xs rounded border border-green-300 hover:border-green-400 transition"
                    >
                        엑셀 다운로드
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Table Section -->
    <div
        class="flex-1 overflow-auto bg-white border border-gray-300 rounded shadow"
    >
        <table class="min-w-full border-collapse text-sm whitespace-nowrap">
            <thead class="bg-gray-50 text-gray-700 sticky top-0 z-10 shadow-sm">
                <tr>
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100 w-8"
                    >
                        <input
                            type="checkbox"
                            on:change={toggleAll}
                            checked={isAllChecked}
                        />
                    </th>
                    <!-- Fixed Columns -->
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100 w-10"
                        >상태</th
                    >
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                        >프로젝트 ID</th
                    >
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                        >프로젝트명</th
                    >
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                        >업무그룹 ID</th
                    >
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                        >c_target_sys_c (업무명)</th
                    >
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                        >전문 ID</th
                    >
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                        >전문 Name</th
                    >

                    <!-- Dynamic Columns -->
                    {#each dynamicColumns as col}
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >{col}</th
                        >
                    {/each}
                    <th
                        class="border-b border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                        >...</th
                    >
                </tr>
            </thead>
            <tbody class="bg-white">
                {#if isLoading}
                    <tr
                        ><td colspan="100" class="text-center py-4"
                            >로딩중...</td
                        ></tr
                    >
                {:else if dataList.length === 0}
                    <tr
                        ><td
                            colspan="100"
                            class="text-center py-4 text-gray-500"
                            >데이터가 없습니다.</td
                        ></tr
                    >
                {:else}
                    {#each dataList as row}
                        <tr
                            class="hover:bg-blue-50 transition-colors border-b border-gray-200 {row.isChecked
                                ? 'bg-blue-100'
                                : ''}"
                        >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                            >
                                <input
                                    type="checkbox"
                                    bind:checked={row.isChecked}
                                />
                            </td>
                            <!-- Fixed Values -->
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center font-semibold {row.status ===
                                'N'
                                    ? 'text-green-600'
                                    : row.status === 'D'
                                      ? 'text-red-500'
                                      : 'text-gray-600'}"
                            >
                                {row.status}
                            </td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{row.projectId}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{row.projectName}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{row.jobGroupId}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{row.jobName}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{row.messageId}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{row.messageName}</td
                            >

                            <!-- Dynamic Values (Editable) -->
                            {#each dynamicColumns as col}
                                <td
                                    class="border-r border-gray-200 px-2 py-1 text-center p-0"
                                    contenteditable="true"
                                    bind:textContent={row.dynamicData[col]}
                                    on:input={() => {
                                        if (row.status === "R")
                                            row.status = "U";
                                        row.isChecked = true;
                                    }}
                                ></td>
                            {/each}
                            <td class="border-r border-gray-200"></td>
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </table>
    </div>

    <input
        type="file"
        bind:this={fileInput}
        on:change={handleFileChange}
        class="hidden"
        accept=".xlsx, .xls"
    />
</div>

<style>
    /* Table Styling overrides if needed */
    th,
    td {
        white-space: nowrap;
    }
</style>
