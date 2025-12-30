<script>
    import { onMount } from "svelte";
    import { rooturl } from "../aqtstore";
    import * as XLSX from "xlsx";

    let commHeaderList = [];

    // Top Form Data
    let currentHeader = {
        pkey: "",
        project: "",
        job: "",
        comm_header_id: "",
        comm_header_name_kr: "",
        comm_header_name_en: "",
        msg_type: "",
        format: "1",
        direction: "1",
        total_length: "",
        description: "",
    };

    // Filters for Bottom Grid
    let projects = [];
    let businesses = [];
    let searchProjectId = "";
    let searchAppId = "";
    let searchType = "all";
    let searchKeyword = "";
    let selectedIds = new Set();

    // Pagination State
    let currentPage = 1;
    let itemsPerPage = 12;
    $: totalPages = Math.ceil(commHeaderList.length / itemsPerPage);
    $: paginatedList = commHeaderList.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    function goToPage(page) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
        }
    }

    onMount(async () => {
        await fetchProjects();
        await fetchBusinesses();
    });

    async function fetchProjects() {
        try {
            const res = await fetch(`${$rooturl}/project/list`);
            if (res.ok) {
                projects = await res.json();
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function fetchBusinesses() {
        try {
            const res = await fetch(`${$rooturl}/project/business/list`);
            if (res.ok) {
                businesses = await res.json();
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Reset app when project changes (Search only)
    function handleSearchProjectChange() {
        searchAppId = "";
        fetchCommHeaders();
    }

    // Reset app when project changes (Top only)
    function handleTopProjectChange() {
        currentHeader.job = "";
    }

    async function handleTopSearch() {
        if (!searchProjectId || !searchAppId) {
            alert("프로젝트와 업무를 모두 선택해야 조회가 가능합니다.");
            return;
        }

        searchKeyword = ""; // Clear specific keyword search when searching by Project/Job
        searchType = "all";

        await fetchCommHeaders();

        // Then fetch detail
        try {
            const res = await fetch(
                `${$rooturl}/commHeader/detail?prj_id=${searchProjectId}&app_id=${searchAppId}`,
            );
            if (res.ok) {
                const data = await res.json();
                if (data && data.PKEY) {
                    currentHeader = {
                        pkey: data.PKEY,
                        project: data.PRJ_ID,
                        job: data.APP_ID,
                        comm_header_id: data.COMMHD_ID || "",
                        comm_header_name_kr: data.COMMHD_KR_NM || "",
                        comm_header_name_en: data.COMMHD_EN_NM || "",
                        msg_type: data.MSG_TYPE ? String(data.MSG_TYPE) : "",
                        format: String(data.FORMAT_GB || "1"),
                        direction: String(data.DIREC_GB || "1"),
                        total_length: data.TOT_LEN || "",
                        description: data.COMMENT || "",
                    };
                } else {
                    // When no data found, clear form but set project/job to searched ones
                    resetForm();
                    currentHeader.project = searchProjectId;
                    currentHeader.job = searchAppId;
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    function handleSearchProjectChangeTop() {
        searchAppId = "";
    }

    async function fetchCommHeaders() {
        if (!searchProjectId || !searchAppId) {
            alert("상단에서 프로젝트와 업무를 먼저 조회해 주세요.");
            return;
        }
        try {
            const params = new URLSearchParams({
                type: searchType,
                keyword: searchKeyword,
                prj_id: searchProjectId,
                app_id: searchAppId,
            });
            const res = await fetch(
                `${$rooturl}/commHeader/list?${params.toString()}`,
            );
            if (res.ok) {
                commHeaderList = await res.json();
                currentPage = 1; // Reset to first page on search
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleTopSave() {
        if (!currentHeader.comm_header_name_kr) {
            alert("CommHeader명(한글)은 필수입니다.");
            return;
        }

        if (!confirm("CommHeader 정보를 저장하시겠습니까?")) return;

        try {
            const res = await fetch(`${$rooturl}/commHeader/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentHeader),
            });

            if (res.ok) {
                alert("저장되었습니다.");
            } else {
                const text = await res.text();
                alert(`저장 실패: ${text}`);
            }
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        }
    }

    function resetForm() {
        currentHeader = {
            pkey: "",
            project: "",
            job: "",
            comm_header_id: "",
            comm_header_name_kr: "",
            comm_header_name_en: "",
            msg_type: "",
            format: "1",
            direction: "1",
            total_length: "",
            description: "",
        };
    }

    // Grid functions
    function toggleAll(event) {
        if (event.target.checked) {
            selectedIds = new Set(commHeaderList.map((item) => item.PKEY));
        } else {
            selectedIds = new Set();
        }
        selectedIds = selectedIds;
    }

    function toggleOne(id) {
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
        } else {
            selectedIds.add(id);
        }
        selectedIds = selectedIds;
    }

    function handleGridAdd() {
        if (!searchProjectId || !searchAppId) {
            alert("상단에서 프로젝트와 업무를 먼저 조회해 주세요.");
            return;
        }
        const project = projects.find((p) => p.PRJ_ID == searchProjectId);

        // Find max PKEY and max COMMHDFLD_ID in current list
        let maxPkey = 0;
        let maxFldNum = 0;
        commHeaderList.forEach((item) => {
            if (item.PKEY && !isNaN(item.PKEY) && item.PKEY > maxPkey)
                maxPkey = item.PKEY;
            if (item.COMMHDFLD_ID && item.COMMHDFLD_ID.startsWith("FLD")) {
                const num = parseInt(item.COMMHDFLD_ID.replace("FLD", ""), 10);
                if (!isNaN(num) && num > maxFldNum) maxFldNum = num;
            }
        });

        // Calculate nextPkey and nextFldId
        const nextPkey = maxPkey + 1;
        const nextFldId = "FLD" + String(maxFldNum + 1).padStart(11, "0");

        const newItem = {
            PKEY: nextPkey, // Sequential unique ID
            COMMHDFLD_ID: nextFldId,
            PRJ_ID: searchProjectId,
            PRJ_NM: project ? project.PRJ_NM : "",
            APP_ID: searchAppId,
            COMMHD_ID: currentHeader.comm_header_id,
            COMMHD_KR_NM: currentHeader.comm_header_name_kr,
            FLD_KR_NM: "",
            FLD_EN_NM: "",
            FLD_TYPE: "",
            FLD_LEN: "",
            FLD_CMT: "",
            FLD_SGMT: "",
            ST_POS: "",
            FLD_ORDER: "",
            ESSEN_YN: "",
            DEFAULT_VAL: "",
            FLD_FORMAT: "",
            FLD_CDSET: "",
            MASK_YN: "",
            META_CONV_RULE: "",
            isNew: true,
        };
        commHeaderList = [newItem, ...commHeaderList];
        selectedIds.add(nextPkey);
        selectedIds = selectedIds;
        currentPage = 1; // Jump to first page to see the new row
    }

    async function handleGridDelete() {
        if (selectedIds.size === 0) {
            alert("삭제할 항목을 선택해주세요.");
            return;
        }

        if (!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`))
            return;

        try {
            for (let id of selectedIds) {
                const res = await fetch(`${$rooturl}/commHeader/delete/${id}`, {
                    method: "DELETE",
                });
                if (!res.ok) {
                    const text = await res.text();
                    console.error(`Failed to delete PKEY ${id}: ${text}`);
                }
            }
            alert("삭제되었습니다.");
            selectedIds = new Set();
            fetchCommHeaders();
        } catch (e) {
            console.error(e);
            alert("삭제 중 오류가 발생했습니다.");
        }
    }

    async function handleGridSave() {
        const itemsToSave = commHeaderList.filter((item) =>
            selectedIds.has(item.PKEY),
        );

        if (itemsToSave.length === 0) {
            alert("저장할 항목을 선택해주세요.");
            return;
        }

        if (!confirm(`선택한 ${itemsToSave.length}건을 저장하시겠습니까?`))
            return;

        try {
            const res = await fetch(`${$rooturl}/commHeader/saveList`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(itemsToSave),
            });

            if (res.ok) {
                alert("리스트가 저장되었습니다.");
                selectedIds = new Set();
                fetchCommHeaders();
            } else {
                const text = await res.text();
                alert(`리스트 저장 실패: ${text}`);
            }
        } catch (error) {
            console.error(error);
            alert("리스트 저장 중 오류가 발생했습니다.");
        }
    }

    function handleExcelDownload() {
        const itemsToExport = commHeaderList.map((item) => {
            const {
                PKEY,
                COMMHDFLD_ID,
                PRJ_ID,
                APP_ID,
                COMMHD_ID,
                COMMHD_KR_NM,
                ...rest
            } = item;
            return rest;
        });
        const ws = XLSX.utils.json_to_sheet(itemsToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CommHeaderList");
        XLSX.writeFile(wb, "CommHeaderList.xlsx");
    }

    let fileInput;

    function handleExcelUpload() {
        if (!searchProjectId || !searchAppId) {
            alert("상단에서 프로젝트와 업무를 먼저 조회해 주세요.");
            return;
        }
        fileInput.click();
    }

    async function onFileSelected(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            if (json.length > 0) {
                const project = projects.find(
                    (p) => p.PRJ_ID == searchProjectId,
                );

                // Find max PKEY and max COMMHDFLD_ID
                let maxPkey = 0;
                let maxFldNum = 0;
                commHeaderList.forEach((item) => {
                    if (item.PKEY && !isNaN(item.PKEY) && item.PKEY > maxPkey)
                        maxPkey = item.PKEY;
                    if (
                        item.COMMHDFLD_ID &&
                        item.COMMHDFLD_ID.startsWith("FLD")
                    ) {
                        const num = parseInt(
                            item.COMMHDFLD_ID.replace("FLD", ""),
                            10,
                        );
                        if (!isNaN(num) && num > maxFldNum) maxFldNum = num;
                    }
                });

                const newItems = json.map((row) => {
                    maxPkey++;
                    maxFldNum++;
                    const nextFldId =
                        "FLD" + String(maxFldNum).padStart(11, "0");
                    return {
                        ...row,
                        PKEY: maxPkey,
                        COMMHDFLD_ID: nextFldId,
                        PRJ_ID: searchProjectId,
                        PRJ_NM: project ? project.PRJ_NM : "",
                        APP_ID: searchAppId,
                        COMMHD_ID: currentHeader.comm_header_id,
                        COMMHD_KR_NM: currentHeader.comm_header_name_kr,
                        isNew: true,
                    };
                });

                commHeaderList = [...newItems, ...commHeaderList];
                newItems.forEach((item) => selectedIds.add(item.PKEY));
                selectedIds = selectedIds;
                alert(`${newItems.length}건이 업로드되었습니다.`);
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = "";
    }

    function handleRowClick(item) {
        // Row click no longer populates the top form.
        // It is now driven by search criteria.
    }
</script>

<div
    class="container mx-auto p-4 lg:p-8 bg-gray-50 flex flex-col h-[calc(100vh-4.1rem)] bg-gray-50 p-4 lg:p-8 gap-4"
>
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-800">CommHeader 등록</h2>
    </div>

    <!-- Top Section Form -->
    <div class="bg-white shadow border border-gray-300 p-4 mb-6">
        <!-- Top Right Controls (Project/Job Select & Buttons) -->
        <div class="flex justify-end mb-2 space-x-2 items-center">
            <div class="flex items-center space-x-2 mr-4">
                <div class="flex items-center">
                    <span
                        class="mr-1 text-sm font-bold text-gray-600 bg-gray-200 px-2 py-1 border border-gray-300"
                        >프로젝트</span
                    >
                    <select
                        class="border border-gray-300 rounded px-2 py-1 text-sm"
                        bind:value={searchProjectId}
                        on:change={handleSearchProjectChangeTop}
                    >
                        <option value="">프로젝트 선택</option>
                        {#each projects as prj}
                            <option value={prj.PRJ_ID}>{prj.PRJ_NM}</option>
                        {/each}
                    </select>
                </div>
                <div class="flex items-center">
                    <span
                        class="mr-1 text-sm font-bold text-gray-600 bg-gray-200 px-2 py-1 border border-gray-300"
                        >업무</span
                    >
                    <select
                        class="border border-gray-300 rounded px-2 py-1 text-sm"
                        bind:value={searchAppId}
                    >
                        <option value="">업무 선택</option>
                        {#each businesses.filter((b) => !searchProjectId || b.PRJ_ID == searchProjectId) as biz}
                            <option value={biz.APP_ID}>{biz.APPNM}</option>
                        {/each}
                    </select>
                </div>
            </div>
            <button
                on:click={handleTopSearch}
                class="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-3 py-1 text-sm rounded transition"
                >조회</button
            >
            <button
                on:click={handleTopSave}
                class="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-3 py-1 text-sm rounded transition"
                >저장</button
            >
        </div>

        <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm"
        >
            <!-- Row 1 (Visual shift from Image: Project/Job moved to top right control bar or kept responsive) -->
            <!-- Based on image, Project/Job are also in the form grid layout. duplicating for fidelity to image layout if strictly followed, but usually one selection drives the form. I'll follow image layout closely below the top bar. -->

            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >프로젝트</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentHeader.project}
                    on:change={handleTopProjectChange}
                >
                    <option value="">프로젝트 선택</option>
                    {#each projects as prj}
                        <option value={prj.PRJ_ID}>{prj.PRJ_NM}</option>
                    {/each}
                </select>
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >업무</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentHeader.job}
                >
                    <option value="">업무 선택</option>
                    {#each businesses.filter((b) => !currentHeader.project || b.PRJ_ID == currentHeader.project) as biz}
                        <option value={biz.APP_ID}>{biz.APPNM}</option>
                    {/each}
                </select>
            </div>
            <div class="flex items-center">
                <label
                    class="w-35 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >CommHeader ID</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2 bg-gray-100 text-gray-500"
                    placeholder="COM00000000001 (자동생성)"
                    disabled
                    bind:value={currentHeader.comm_header_id}
                />
            </div>

            <!-- Row 2 -->
            <div class="flex items-center">
                <label
                    class="w-35 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >CommHeader(한글)</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="전문명(한글) 입력"
                    bind:value={currentHeader.comm_header_name_kr}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-35 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >CommHeader(영문)</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="전문명(영문) 입력"
                    bind:value={currentHeader.comm_header_name_en}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >전문유형</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentHeader.msg_type}
                >
                    <option value="">요청/응답 선택</option>
                    <option value="1">요청</option>
                    <option value="2">응답</option>
                </select>
            </div>

            <!-- Row 3 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >포맷</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentHeader.format}
                >
                    <option value="1">FIXED</option>
                    <option value="2">JSON</option>
                    <option value="3">XML</option>
                </select>
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >방향</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentHeader.direction}
                >
                    <option value="1">Inbound</option>
                    <option value="2">Outbound</option>
                </select>
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >전체길이</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="Fixed만 해당"
                    bind:value={currentHeader.total_length}
                />
            </div>
        </div>
        <!-- Row 4: Description (Full Width) -->
        <div class="flex items-center mt-2 text-sm">
            <label
                class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                >설명</label
            >
            <input
                type="text"
                class="flex-1 border border-gray-300 py-1 px-2"
                placeholder="해당 전문의 역할/설명 입력"
                bind:value={currentHeader.description}
            />
        </div>
    </div>

    <!-- Bottom Section: Grid -->
    <div class="bg-white p-4 shadow border border-gray-300">
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center">
                <input
                    type="file"
                    class="hidden"
                    accept=".xlsx, .xls"
                    bind:this={fileInput}
                    on:change={onFileSelected}
                />
            </div>

            <div class="flex space-x-2 items-center">
                <select
                    class="border border-gray-300 rounded px-2 py-1 text-sm"
                    bind:value={searchType}
                >
                    <option value="all">전체</option>
                    <option value="FLD_EN_NM">필드명(영문)</option>
                    <option value="FLD_KR_NM">필드명(한글)</option>
                    <option value="FLD_DESC">필드설명</option>
                </select>
                <input
                    type="text"
                    class="border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="필드명 입력"
                    bind:value={searchKeyword}
                />
                <button
                    on:click={fetchCommHeaders}
                    class="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-3 py-1 text-sm rounded"
                    >조회</button
                >
                <button
                    on:click={handleGridAdd}
                    class="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-3 py-1 text-sm rounded"
                    >추가</button
                >
                <button
                    on:click={handleGridDelete}
                    class="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-3 py-1 text-sm rounded"
                    >삭제</button
                >
                <button
                    on:click={handleGridSave}
                    class="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-3 py-1 text-sm rounded"
                    >저장</button
                >
                <button
                    on:click={handleExcelUpload}
                    class="bg-white hover:bg-gray-100 text-blue-600 border border-green-600 px-3 py-1 text-sm rounded"
                    >엑셀 업로드</button
                >
                <button
                    on:click={handleExcelDownload}
                    class="bg-white hover:bg-gray-100 text-green-600 border border-green-600 px-3 py-1 text-sm rounded"
                    >엑셀다운로드</button
                >
            </div>
        </div>

        <!-- Grid Table -->
        <div class="overflow-x-auto">
            <table
                class="min-w-full border-collapse border border-gray-300 text-xs text-center whitespace-nowrap"
            >
                <thead class="bg-gray-100 text-gray-700 font-semibold">
                    <tr>
                        <th class="border border-gray-300 px-2 py-1 w-8"
                            ><input type="checkbox" on:change={toggleAll} /></th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[100px]"
                            >프로젝트 ID</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[150px]"
                            >프로젝트명</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[120px]"
                            >업무그룹 ID</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[180px]"
                            >c_target_sys_c (업무명)</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[150px]"
                            >CommHeader ID</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[200px]"
                            >CommHeader Name</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[150px]"
                            >CommHeader필드 ID</th
                        >

                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[150px]"
                            >필드명(영문)</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[150px]"
                            >필드명(한글)</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[100px]"
                            >필드타입</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[100px]"
                            >필드자리수</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[200px]"
                            >필드설명</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[180px]"
                            >세그먼트</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[100px]"
                            >시작위치</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[80px]"
                            >순서</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[100px]"
                            >필수여부</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[120px]"
                            >기본값</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[150px]"
                            >포맷/패턴</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[150px]"
                            >코드셋</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[100px]"
                            >마스킹여부</th
                        >
                        <th
                            class="border border-gray-300 px-2 py-1 min-w-[200px]"
                            >비고</th
                        >
                    </tr>
                </thead>
                <tbody class="bg-white">
                    {#each paginatedList as item (item.PKEY)}
                        <tr
                            class="hover:bg-blue-50 cursor-pointer"
                            on:click={() => handleRowClick(item)}
                        >
                            <td
                                class="border border-gray-300 px-2 py-1"
                                on:click|stopPropagation
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(item.PKEY)}
                                    on:change={() => toggleOne(item.PKEY)}
                                />
                            </td>
                            <td
                                class="border border-gray-300 px-1 py-1 disabled"
                            >
                                {item.PRJ_ID}
                            </td>
                            <td
                                class="border border-gray-300 px-1 py-1 disabled"
                            >
                                {item.PRJ_NM}
                            </td>
                            <td
                                class="border border-gray-300 px-1 py-1 disabled"
                            >
                                {item.APP_ID}
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                {businesses.find((b) => b.APP_ID == item.APP_ID)
                                    ?.APPNM || ""}
                            </td>
                            <td
                                class="border border-gray-300 px-1 py-1 disabled"
                            >
                                {item.COMMHD_ID}
                            </td>
                            <td
                                class="border border-gray-300 px-1 py-1 disabled"
                            >
                                {item.COMMHD_KR_NM}
                            </td>
                            <td
                                class="border border-gray-300 px-1 py-1 disabled"
                            >
                                {item.COMMHDFLD_ID}
                            </td>

                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.FLD_EN_NM}
                                />
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.FLD_KR_NM}
                                />
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.FLD_TYPE}
                                />
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.FLD_LEN}
                                />
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.FLD_CMT}
                                />
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <select
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.FLD_SGMT}
                                >
                                    <option value=""></option>
                                    <option value="1">1:ChlHeader</option>
                                    <option value="2">2:CommonHeader</option>
                                    <option value="3">3:DataHeader</option>
                                    <option value="4">4:Databody</option>
                                    <option value="5">5:Tail</option>
                                </select>
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.ST_POS}
                                />
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.FLD_ORDER}
                                />
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.ESSEN_YN}
                                />
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.DEFAULT_VAL}
                                />
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.FLD_FORMAT}
                                />
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.FLD_CDSET}
                                />
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.MASK_YN}
                                />
                            </td>
                            <td class="border border-gray-300 px-1 py-1">
                                <input
                                    type="text"
                                    class="w-full bg-transparent border-none text-center outline-none"
                                    bind:value={item.META_CONV_RULE}
                                />
                            </td>
                        </tr>
                    {/each}
                    {#if commHeaderList.length === 0}
                        <tr
                            ><td
                                colspan="23"
                                class="text-center py-4 border border-gray-300"
                                >데이터가 없습니다.</td
                            ></tr
                        >
                    {/if}
                </tbody>
            </table>
        </div>

        <!-- Pagination Controls -->
        {#if totalPages > 1}
            <div class="flex justify-center items-center mt-4 space-x-1">
                <button
                    class="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50"
                    on:click={() => goToPage(1)}
                    disabled={currentPage === 1}
                >
                    처음
                </button>
                <button
                    class="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50"
                    on:click={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    이전
                </button>

                {#each Array(Math.min(5, totalPages)) as _, i}
                    {@const pageNum =
                        totalPages <= 5
                            ? i + 1
                            : Math.min(
                                  Math.max(currentPage - 2, 1),
                                  totalPages - 4,
                              ) + i}
                    <button
                        class="px-3 py-1 border border-gray-300 rounded text-sm {currentPage ===
                        pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'hover:bg-gray-100'}"
                        on:click={() => goToPage(pageNum)}
                    >
                        {pageNum}
                    </button>
                {/each}

                <button
                    class="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50"
                    on:click={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    다음
                </button>
                <button
                    class="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50"
                    on:click={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                >
                    마지막
                </button>

                <span class="ml-4 text-sm text-gray-600">
                    Page {currentPage} of {totalPages} (Total {commHeaderList.length}
                    items)
                </span>
            </div>
        {/if}
    </div>
</div>
