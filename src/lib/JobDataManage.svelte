<script>
    import { onMount } from "svelte";
    import { read, utils, writeFile } from "xlsx";
    import { rooturl } from "../aqtstore";
    // 프로젝트 목록 데이터
    let projects = [];
    let projectSelectElement;
    // 업무 목록 데이터
    let jobs = [];
    let jobSelectElement;
    let messages = []; // 전문 목록
    let dataList = []; // 그리드 데이터
    let isLoading = false;

    // 필터 상태
    let selectedProject = "";
    let selectedJob = "";
    let selectedMessageId = "";
    let filteredMessages = [];

    onMount(async () => {
        try {
            await searchProjects();
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        }
    });

    // 프로젝트 목록 조회
    async function searchProjects() {
        try {
            const projectRes = await fetch($rooturl + "/common/project/list");
            projects = await projectRes.json();
        } catch (error) {
            console.error("프로젝트 목록 로딩 실패:", error);
        }
    }

    // 업무 목록 조회
    async function searchJobs() {
        selectedJob = "";
        messages = [];
        const queryParams = selectedProject ? `?prj_id=${selectedProject}` : "";
        try {
            const jobRes = await fetch(
                $rooturl + "/common/job/list" + queryParams,
            );
            jobs = await jobRes.json();
        } catch (error) {
            console.error("업무 목록 로딩 실패:", error);
        }
    }

    // 전문 목록 조회
    async function searchMessages() {
        let queryParams = selectedProject ? `?prj_id=${selectedProject}` : "";
        queryParams += selectedJob ? `&job_id=${selectedJob}` : "";

        try {
            const res = await fetch(
                $rooturl + "/jobs/message/list" + queryParams,
            );
            messages = await res.json();
        } catch (error) {
            console.error("전문 목록 로딩 실패:", error);
        }
    }

    // 조회 함수
    async function datsSearch() {
        if (!selectedMessageId) {
            alert("조회할 전문을 선택해주세요.");
            return;
        }

        isLoading = true;
        try {
            let queryParams = selectedMessageId
                ? `?mgs_id=${selectedMessageId}`
                : "";
            const res = await fetch(`${$rooturl}/jobs/data/list` + queryParams);
            dataList = await res.json();
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

        const newRow = {
            PRJ_ID: selectedProject, // Ensure PRJ_ID is present
            APP_ID: selectedJob, // Add APP_ID for saving
            MSG_ID: selectedMessageId, // Ensure MSG_ID is present
            PRJ_NM: projectSelectElement?.selectedOptions[0]?.text || "",
            // jobGroupId: "GRP_" + selectedJob,
            APP_NM: jobs.find((j) => j.APP_ID === selectedJob)?.APPNM || "", // Fix to use correct property lookup
            MSG_KR_NM:
                filteredMessages.find((m) => m.MSG_ID === selectedMessageId)
                    ?.MSG_KR_NM || "",
            isChecked: true,
            status: "N",
            content: "",
            FIXEDLEN_VAL: "", // Init
            COMMENT: "", // Init
        };

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
        const saveItems = dataList.filter(
            (d) => d.status === "N" || d.status === "U" || d.isChecked,
        );

        if (saveItems.length === 0) {
            alert("저장할 변경사항이 없습니다.");
            return;
        }

        for (const item of saveItems) {
            if (!item.FIXEDLEN_VAL || item.FIXEDLEN_VAL.trim() === "") {
                alert("전문데이터는 필수 입력 항목입니다.");
                return;
            }
        }

        if (confirm(`${saveItems.length}건을 저장하시겠습니까?`)) {
            try {
                const res = await fetch(`${$rooturl}/jobs/data/save`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(saveItems),
                });
                const result = await res.json();
                alert(`${result.count}건을 저장했습니다.`);

                // Reload to get fresh state
                datsSearch();
            } catch (error) {
                console.error("저장 실패:", error);
                alert("저장 중 오류가 발생했습니다.");
            }
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

            // 3. Map Excel rows to Data Objects
            const newRows = jsonData.map((row) => {
                const prjId = row["프로젝트 ID"] || selectedProject;
                const appId = row["업무 ID"] || selectedJob;
                const msgId = row["전문 ID"] || selectedMessageId;

                const project = projects.find((p) => p.PRJ_ID === prjId);
                const job = jobs.find((j) => j.APP_ID === appId);
                const message =
                    messages.find((m) => m.MSG_ID === msgId) ||
                    (filteredMessages
                        ? filteredMessages.find((m) => m.MSG_ID === msgId)
                        : null);

                return {
                    PRJ_ID: prjId,
                    PRJ_NM: project ? project.PRJ_NM : row["프로젝트명"] || "",
                    APP_ID: appId,
                    APP_NM: job ? job.APPNM : row["업무명"] || "",
                    MSG_ID: msgId,
                    MSG_KR_NM: message
                        ? message.MSG_KR_NM
                        : row["전문명"] || "",
                    MSGDT_ID: "", // If empty, backend will generate
                    FIXEDLEN_VAL: row["전문데이터"] || row["content"] || "",
                    COMMENT: row["설명"] || row["comment"] || "",
                    isChecked: true,
                    status: "N", // Treat imported as New
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
            const project = projects.find((p) => p.PRJ_ID === row.PRJ_ID);
            const job = jobs.find((j) => j.APP_ID === row.APP_ID);

            const flat = {
                "프로젝트 ID": row.PRJ_ID,
                프로젝트명: project ? project.PRJ_NM : row.PRJ_NM || "",
                "업무 ID": row.APP_ID,
                업무명: job ? job.APPNM : row.APP_NM || "",
                "전문 ID": row.MSG_ID,
                전문명: row.MSG_KR_NM,
                전문데이터ID: row.MSGDT_ID,
                전문데이터: row.FIXEDLEN_VAL,
                설명: row.COMMENT,
            };
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
                        bind:this={projectSelectElement}
                        on:change={searchJobs}
                        class="border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-blue-500 min-w-[120px]"
                    >
                        <option value="">프로젝트 선택</option>
                        {#each projects as project}
                            <option value={project.PRJ_ID}
                                >{project.PRJ_NM}</option
                            >
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
                        bind:this={jobSelectElement}
                        on:change={searchMessages}
                        class="border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-blue-500 min-w-[120px]"
                    >
                        <option value="">업무 선택</option>
                        {#each jobs as job}
                            <option value={job.APP_ID}>{job.APPNM}</option>
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
                        {#each messages as msg}
                            <option value={msg.MSG_ID}>{msg.MSG_KR_NM}</option>
                        {/each}
                    </select>
                </div>

                <div class="flex gap-1 ml-2">
                    <button
                        on:click={datsSearch}
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
                        >업무명</th
                    >
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                        >전문 ID</th
                    >
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                        >전문명</th
                    >
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                        >전문데이터ID</th
                    >
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100 min-w-[200px]"
                        >전문데이터</th
                    >
                    <th
                        class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100 min-w-[150px]"
                        >설명</th
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
                                >{row.PRJ_ID || ""}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{projects.find((p) => p.PRJ_ID == row.PRJ_ID)
                                    ?.PRJ_NM || ""}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{row.APP_ID || ""}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{jobs.find((j) => j.APP_ID == row.APP_ID)
                                    ?.APPNM || ""}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{row.MSG_ID || ""}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{messages.find((m) => m.MSG_ID == row.MSG_ID)
                                    ?.MSG_KR_NM || ""}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{row.MSGDT_ID || ""}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center p-0"
                                contenteditable="true"
                                bind:textContent={row.FIXEDLEN_VAL}
                                on:input={() => {
                                    if (row.status === "R") row.status = "U";
                                    row.isChecked = true;
                                }}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center p-0"
                                contenteditable="true"
                                bind:textContent={row.COMMENT}
                                on:input={() => {
                                    if (row.status === "R") row.status = "U";
                                    row.isChecked = true;
                                }}
                            ></td>
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
