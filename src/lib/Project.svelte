<script>
    import { onMount } from "svelte";
    import { rooturl } from "../aqtstore";
    import * as XLSX from "xlsx";

    let projects = []; // For Dropdown (Project List)
    let businessItems = []; // For Grid (Business List)
    let isLoading = false;
    let errorMessage = "";
    let selectedProject = "";
    let jobs = []; // Job List for Metadata

    // Top Form Data
    let currentProject = {
        prj_id: "",
        prj_nm: "",
        enc_val: "MS949",
        tcode: "",
        prototype: "0",
        COMPR_YN: "0",
        virtual_col1: "",
        virtual_col2: "",
        failure_cond:
            "AND (a.rcode <> b.rcode or a.rcode > 399 or b.rcode > 399)",
        aqttype: "TCP",
        ptype: "C",
        dstf: "",
        otheropt: "",
        t_code: "",
        dstlp: "", // dstlp from image
        dstport: "",
        svcid: "",
        othercond: "",
        norcv: "1",
        dbskip: "0",
        maxcnt: "",
        immd: "0",
        ctype: "0",
    };

    // Filters for Bottom Grid
    let searchType = "all";
    let searchKeyword = "";
    let selectedIds = new Set();

    // Top Select Selection
    let selectedTopProjectId = "";

    // Mock Data for demonstration
    onMount(() => {
        //fetchProjects();
        // fetchBusinessItems();
        loadMetadata();
    });

    async function loadMetadata() {
        try {
            const projectRes = await fetch($rooturl + "/project/list");
            projects = await projectRes.json();
        } catch (error) {
            console.error("메타데이터 로딩 실패:", error);
        }
    }

    async function fetchProjects() {
        try {
            isLoading = true;
            const res = await fetch(
                `${$rooturl}/project/list?keyword=${searchKeyword}`,
            );
            if (res.ok) {
                projects = await res.json();
                console.log("projects:" + projects.getProjectList());
            } else {
                console.error("Failed to fetch projects");
                projects = []; // Clear or handle error
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            isLoading = false;
        }
    }

    async function fetchBusinessItems() {
        try {
            isLoading = true;
            // Prioritize Keyword Search if exists
            if (searchKeyword) {
                const res = await fetch(
                    `${$rooturl}/project/business/list?type=${searchType}&keyword=${searchKeyword}`,
                );
                if (res.ok) businessItems = await res.json();
            } else if (selectedProject && selectedProject !== "프로젝트 선택") {
                // Otherwise if project selected, load project items
                const res = await fetch(
                    `${$rooturl}/project/business/list?type=project_id&keyword=${selectedProject}`,
                );
                if (res.ok) {
                    businessItems = await res.json();
                } else {
                    console.error("Failed to fetch business items");
                    businessItems = [];
                }
            } else {
                // Empty start
                businessItems = [];
            }
        } catch (error) {
            console.error("Error fetching business items:", error);
        } finally {
            isLoading = false;
        }
    }

    function handleGridRowClick(project) {
        if (project.isNew) return; // Don't clear form for new rows
        // Map grid row data to top form
        // Backend returns uppercase aliases as defined in projectManagement.js getProjectList
        currentProject = {
            prj_id: project.PRJ_ID,
            prj_nm: project.PRJ_NM,
            enc_val: (project.ENC_VAL || "").trim(),
            tcode: project.TCODE,
            prototype: String(
                project.PROTO_TYPE !== undefined ? project.PROTO_TYPE : "0",
            ).trim(),
            COMPR_YN: String(
                project.COMPR_YN !== undefined ? project.COMPR_YN : "0",
            ).trim(),
            virtual_col1: project.VIRT_COL1,
            virtual_col2: project.VIRT_COL2,
            failure_cond: project.FAIL_COND,

            aqttype: (project.AQTTYPE || project.AQT_TYPE || "TMAX").trim(),

            // ctype maps to CONN column
            ctype: String(
                project.CONN !== undefined && project.CONN !== null
                    ? project.CONN
                    : "0",
            ).trim(),
            ptype: String(project.PTYPE || project.P_TYPE || "C").trim(),
            dstf: project.DSTF || "",

            // immd maps to DSTV column
            immd: String(
                project.IMMD !== undefined && project.IMMD !== null
                    ? project.IMMD
                    : "0",
            ).trim(),

            otheropt: project.OTHEROPT || "",
            t_code: project.T_CODE || "", // Priority to CapInfo T_CODE
            dstlp: project.DSTIP || "",
            dstport: project.DSTPORT !== undefined ? project.DSTPORT : "0",
            svcid: project.SVCID || "",
            othercond: project.OTHERCOND || "",
            norcv: project.NORCV || "",
            dbskip: String(project.DBSKIP || "N").trim(),
            maxcnt: project.MAXCNT || "",
        };
    }

    function resetForm() {
        currentProject = {
            prj_id: "",
            prj_nm: "",
            enc_val: "",
            tcode: "",
            prototype: "0",
            COMPR_YN: "0",
            virtual_col1: "",
            virtual_col2: "",
            failure_cond: "",
            aqttype: "TCP",
            ctype: "0",
            ptype: "C",
            dstf: "",
            immd: "0",
            otheropt: "",
            t_code: "",
            dstlp: "",
            dstport: "0",
            svcid: "",
            othercond: "",
            norcv: "1",
            dbskip: "0",
            maxcnt: "",
        };
    }

    async function handleTopSearch() {
        // Handle Top Inquiry Button
        // Clear bottom search to show full project list
        searchKeyword = "";

        if (selectedProject && selectedProject !== "") {
            const found = projects.find((p) => p.PRJ_ID == selectedProject);
            if (found) {
                handleGridRowClick(found);
            }
        }

        fetchBusinessItems(); // Refresh grid list
    }

    async function handleTopSave() {
        if (!currentProject.prj_nm) {
            alert("프로젝트명은 필수입니다.");
            return;
        }

        if (!confirm("프로젝트 정보를 저장하시겠습니까?")) return;

        try {
            const res = await fetch(`${$rooturl}/project/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentProject),
            });

            if (res.ok) {
                alert("저장되었습니다.");
                //fetchProjects(); // Refresh list must happen to see new ID
                loadMetadata();
                resetForm(); // Optional: clear form or keep it
            } else {
                const text = await res.text();
                alert(`저장 실패: ${text}`);
                // alert(JSON.stringify(currentProject));
            }
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        }
    }

    function handleTopSelectChange() {
        if (!selectedProject || selectedProject === "프로젝트 선택") {
            resetForm();
            return;
        }
        // Metadata (projects) key is Uppercase PRJ_ID
        const found = projects.find((p) => p.PRJ_ID == selectedProject);
        if (found) {
            handleGridRowClick(found);
        }
    }

    function toggleAll(event) {
        if (event.target.checked) {
            selectedIds = new Set(
                businessItems.map((p) => p.PKEY || p._tempId),
            ); // Use PKEY or _tempId
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

    // ... Grid functions (Add, Delete, Save, Excel) ...
    async function handleGridAdd() {
        let nextIdNum = 0;

        // 1. Get next ID from Server (DB Max + 1)
        try {
            const res = await fetch(`${$rooturl}/project/business/next-app-id`);
            if (res.ok) {
                const data = await res.json();
                const serverId = data.nextId; // e.g., APP00000000001
                if (serverId && serverId.startsWith("APP")) {
                    const numPart = serverId.substring(3);
                    const num = parseInt(numPart, 10);
                    if (!isNaN(num)) nextIdNum = num;
                }
            }
        } catch (e) {
            console.error("Failed to fetch next APP_ID", e);
        }

        // 2. Check Client-side items for higher ID (Unsaved rows)
        let localMax = 0;
        businessItems.forEach((item) => {
            if (item.APP_ID && item.APP_ID.startsWith("APP")) {
                const numPart = item.APP_ID.substring(3);
                const num = parseInt(numPart, 10);
                if (!isNaN(num) && num > localMax) {
                    localMax = num;
                }
            }
        });

        // If local max is greater than or equal to server's next, increment from local max
        if (localMax >= nextIdNum) {
            nextIdNum = localMax + 1;
        }

        // Default to 1 if something went wrong
        if (nextIdNum === 0) nextIdNum = 1;

        const nextAppId = `APP${String(nextIdNum).padStart(11, "0")}`;

        // Add a new empty row to businessItems for editing
        const newRow = {
            PKEY: null, // New item
            APP_ID: nextAppId, // App ID (was id)
            PRJ_ID: currentProject.prj_id || "", // Default to current selected project if any
            APPNM: "",
            MAIN_MGR: "",
            GUBUN: "",
            SCNT: "",
            HOST_IP: "",
            HOST_PORT: "",
            SVC_URI: "",
            SVC_KR_NM: "",
            SVC_EN_NM: "",
            SVC_KIND: "",
            CUMCNT: "",
            isNew: true,
            _tempId: `new_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
        };
        businessItems = [newRow, ...businessItems];

        // Auto-select the new row
        selectedIds.add(newRow._tempId);
        selectedIds = selectedIds; // Trigger reactivity
    }

    async function handleGridDelete() {
        if (selectedIds.size === 0) {
            alert("삭제할 항목을 선택해주세요.");
            return;
        }

        if (!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`))
            return;

        try {
            // Split into saved (DB) and unsaved (Local)
            const savedIds = [];
            const unsavedIds = [];

            for (let id of selectedIds) {
                // Check if it's a temp ID (starts with 'new_') or has no PKEY
                // But selectedIds contains the value used for keying (PKEY or _tempId)
                if (String(id).startsWith("new_")) {
                    unsavedIds.push(id);
                } else {
                    savedIds.push(id);
                }
            }

            // 1. Delete Saved Items from DB
            for (let id of savedIds) {
                await fetch(`${$rooturl}/project/business/delete/${id}`, {
                    method: "DELETE",
                });
            }

            // 2. Remove all selected from local list
            businessItems = businessItems.filter(
                (item) =>
                    !selectedIds.has(item.PKEY) &&
                    !selectedIds.has(item._tempId),
            );

            alert("삭제되었습니다.");
            selectedIds = new Set();
            // DO NOT fetchBusinessItems(); -> This would wipe out other unsaved new rows
        } catch (e) {
            console.error(e);
            alert("삭제 중 오류 발생");
        }
    }

    async function handleGridSave() {
        alert(
            "프로젝트 수정은 리스트 선택 후 상단 폼에서 '저장' 버튼을 사용해주세요.",
        );

        // Filter modified or new items if needed, or save entire list
        // For this example, we'll save the whole list or selected items logic can be added
        if (!confirm("리스트 변경사항을 저장하시겠습니까?")) return;

        try {
            // Let's loop through and save.
            for (let item of businessItems) {
                // Skip if empty ID or something?
                // Basic check
                if (!item.PRJ_ID && currentProject.prj_id)
                    item.PRJ_ID = currentProject.prj_id;

                // Only save if it has project_id (FK required)
                if (item.PRJ_ID) {
                    const payload = {
                        pkey: item.PKEY,
                        app_id: item.APP_ID,
                        prj_id: item.PRJ_ID,
                        appnm: item.APPNM,
                        main_mgr: item.MAIN_MGR,
                        gubun: item.GUBUN,
                        scnt: item.SCNT,
                        host_ip: item.HOST_IP,
                        host_port: item.HOST_PORT,
                        svc_uri: item.SVC_URI,
                        svc_kr_nm: item.SVC_KR_NM,
                        svc_en_nm: item.SVC_EN_NM,
                        svc_kind: item.SVC_KIND,
                        cumcnt: item.CUMCNT,
                    };
                    await fetch(`${$rooturl}/project/business/save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                }
            }

            alert("저장 완료");
            fetchBusinessItems();
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        }
    }

    function handleExcelDownload() {
        // Exclude PKEY, APP_ID, PRJ_ID from export
        const exportData = businessItems.map(
            ({ PKEY, APP_ID, PRJ_ID, _tempId, isNew, ...rest }) => rest,
        );
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ProjectList");
        XLSX.writeFile(wb, "ProjectList.xlsx");
    }
    async function handleGridSearch() {
        // Just search, do NOT clear project selection
        await fetchBusinessItems();
    }

    let fileInput; // Bind to input element

    async function handleExcelUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    alert("데이터가 없습니다.");
                    return;
                }

                // 1. Get next ID from Server
                let nextIdNum = 1;
                try {
                    const res = await fetch(
                        `${$rooturl}/project/business/next-app-id`,
                    );
                    if (res.ok) {
                        const data = await res.json();
                        const serverId = data.nextId;
                        if (serverId && serverId.startsWith("APP")) {
                            const numPart = serverId.substring(3);
                            const num = parseInt(numPart, 10);
                            if (!isNaN(num)) nextIdNum = num;
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch next APP_ID", err);
                }

                // 2. Adjust based on local max (in case of unsaved rows)
                let localMax = 0;
                businessItems.forEach((item) => {
                    if (item.APP_ID && item.APP_ID.startsWith("APP")) {
                        const numPart = item.APP_ID.substring(3);
                        const num = parseInt(numPart, 10);
                        if (!isNaN(num) && num > localMax) {
                            localMax = num;
                        }
                    }
                });
                if (localMax >= nextIdNum) nextIdNum = localMax + 1;

                // 3. Map and Add Rows
                const newRows = jsonData.map((row, index) => {
                    const currentIdNum = nextIdNum + index;
                    const nextAppId = `APP${String(currentIdNum).padStart(11, "0")}`;

                    return {
                        PKEY: null,
                        APP_ID: nextAppId,
                        PRJ_ID: currentProject.prj_id || "", // Use current selected project
                        APPNM: row["APPNM"] || row["업무그룹명"] || "",
                        MAIN_MGR: row["MAIN_MGR"] || row["담당자"] || "",
                        GUBUN: row["GUBUN"] || row["구분"] || "", // Assuming possible KR name
                        SCNT: row["SCNT"] || row["동시접속수"] || "",
                        HOST_IP: row["HOST_IP"] || row["호스트IP"] || "",
                        HOST_PORT: row["HOST_PORT"] || row["호스트Port"] || "",
                        SVC_URI: row["SVC_URI"] || row["서비스ID/URI"] || "",
                        SVC_KR_NM:
                            row["SVC_KR_NM"] || row["서비스명(한글)"] || "",
                        SVC_EN_NM:
                            row["SVC_EN_NM"] || row["서비스명(영문)"] || "",
                        SVC_KIND: row["SVC_KIND"] || row["서비스종류"] || "",
                        CUMCNT: row["CUMCNT"] || row["누적건수"] || "",
                        isNew: true,
                        _tempId: `upload_${Date.now()}_${index}`,
                    };
                });

                businessItems = [...newRows, ...businessItems];

                // Auto-select uploaded rows
                newRows.forEach((row) => selectedIds.add(row._tempId));
                selectedIds = selectedIds; // Trigger reactivity

                alert(
                    `${newRows.length}건이 리스트에 추가되었습니다.\n저장 버튼을 눌러 확정해주세요.`,
                );

                // Clear input to allow re-uploading same file
                event.target.value = "";
            } catch (error) {
                console.error("Excel processing error:", error);
                alert("엑셀 처리 중 오류가 발생했습니다.");
            }
        };
        reader.readAsArrayBuffer(file);
    }
</script>

<div
    class="container mx-auto p-4 lg:p-8 bg-gray-50 flex flex-col h-[calc(100vh-4.1rem)] bg-gray-50 p-4 lg:p-8 gap-4"
>
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-800">프로젝트 정보</h2>
    </div>

    <!-- Top Section: Form -->
    <div class="bg-white shadow border border-gray-300 p-4 mb-6">
        <div class="flex justify-end mb-2 space-x-2">
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
                        <option value={project.PRJ_ID}>{project.PRJ_NM}</option>
                    {/each}
                </select>
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

        <div class="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
            <!-- Row 1 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >프로젝트 ID</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2 bg-gray-100 text-gray-500"
                    placeholder="프로젝트 ID 자동생성"
                    disabled
                    bind:value={currentProject.prj_id}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >프로젝트명</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="프로젝트명 입력"
                    bind:value={currentProject.prj_nm}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >기본 인코딩</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="기본 인코딩 입력"
                    bind:value={currentProject.enc_val}
                />
            </div>

            <!-- Row 2 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >테스트 ID</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="테스트 ID 입력"
                    bind:value={currentProject.tcode}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >프로토콜</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentProject.prototype}
                >
                    <option value="0">0:tcp</option>
                    <option value="1">1:http</option>
                    <option value="2">2:https</option>
                </select>
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >압축여부</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentProject.COMPR_YN}
                >
                    <option value="0">0:압축아님</option>
                    <option value="1">1:압축</option>
                </select>
            </div>

            <!-- Row 3 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >가상컬럼1</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="varchar(100) cast('' as char(100)) charset utf8mb4"
                    bind:value={currentProject.virtual_col1}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >가상컬럼2</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="varchar(100) cast('' as char(100)) charset utf8mb4"
                    bind:value={currentProject.virtual_col2}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >실패조건</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="실패조건 입력"
                    bind:value={currentProject.failure_cond}
                />
            </div>

            <!-- Row 4 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >aqtType</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentProject.aqttype}
                >
                    <option value="TMAX">TMAX</option>
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="JEUS">JEUS</option>
                    <option value="HTTP">HTTP</option>
                </select>
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >ctype</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentProject.ctype}
                >
                    <option value="0">0:tcpdump</option>
                    <option value="1">1:nettl</option>
                    <option value="2">2:snoop</option>
                </select>
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >ptype</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentProject.ptype}
                >
                    <option value="C">C:즉시캡쳐</option>
                    <option value="F">F:파일에서</option>
                </select>
            </div>

            <!-- Row 5 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >dstf</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2 disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="dstf (패킷파일명(ptype 이 F 인 경우))"
                    bind:value={currentProject.dstf}
                    disabled={currentProject.ptype !== "F"}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >immd</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentProject.immd}
                >
                    <option value="0">0:캡쳐와 동시 송신안함</option>
                    <option value="1">1:캡쳐와 동시 테스트송신</option>
                </select>
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >otherOpt</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="otherOpt (Tcpdump 에 추가할 옵션 예 '-A -nn')"
                    bind:value={currentProject.otheropt}
                />
            </div>

            <!-- Row 6 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >tcode</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="tcode (AQT에 등록된 테스트 시나리오 id (tmaster 테이블의 code))"
                    bind:value={currentProject.t_code}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >dstip</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="dstip (응답대상 ip, 목적지 ip 또는 호스트명일수 있음. 임의의 값 입력)"
                    bind:value={currentProject.dstlp}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >dstport</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="dstport (응답 port, 숫자만)"
                    bind:value={currentProject.dstport}
                />
            </div>

            <!-- Row 7 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >svcid</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="svcid (uri or 서비스 id 필터 : tuxedo/tmax 인 경우 svcid)"
                    bind:value={currentProject.svcid}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >othercond</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="otherCond (dump 필터링에서 사용되는 필터 조건 예 'port 80 || 8080')"
                    bind:value={currentProject.othercond}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >norcv</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentProject.norcv}
                >
                    <option value="0">0:송신캡쳐 수신캡쳐</option>
                    <option value="1">1:송신캡쳐 수신 스킵</option>
                </select>
            </div>

            <!-- Row 8 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >dbskip</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="dbskip (1:수신결과를 AQTDB에 저장하지 않음(immd 1인경우 해당))"
                    bind:value={currentProject.dbskip}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >maxcnt</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="maxcnt (dump시 최대 수집건수, 해당건수만큼 수집되면 종료, 0인 경우 제한없음)"
                    bind:value={currentProject.maxcnt}
                />
            </div>
            <!-- Empty 3rd column in Row 8 -->
            <div></div>
        </div>
    </div>

    <!-- Bottom Section: Grid -->
    <div class="bg-white p-4 shadow border border-gray-300">
        <div class="flex justify-between items-center mb-4">
            <div class="space-x-2">
                <!-- <button
                    class="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 text-sm rounded"
                    >엑셀 업로드</button
                >
                <button
                    on:click={handleExcelDownload}
                    class="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 text-sm rounded"
                    >엑셀다운로드</button
                > -->
            </div>

            <div class="flex space-x-2 items-center">
                <select
                    class="border border-gray-300 rounded px-2 py-1 text-sm"
                    bind:value={searchType}
                >
                    <option value="all">전체</option>
                    <option value="APPNM">업무그룹명</option>
                    <option value="SVC_URI">서비스ID/URI</option>
                    <option value="SVC_KR_NM">서비스명(한글)</option>
                    <option value="SVC_EN_NM">서비스명(영문)</option>
                </select>
                <input
                    type="text"
                    class="border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="필드명 입력"
                    bind:value={searchKeyword}
                />
                <button
                    on:click={handleGridSearch}
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
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    class="hidden"
                    bind:this={fileInput}
                    on:change={handleExcelUpload}
                />
                <button
                    on:click={() => fileInput.click()}
                    class="bg-white hover:bg-gray-100 text-green-600 border border-green-600 px-3 py-1 text-sm rounded"
                    >엑셀 업로드</button
                >
                <button
                    on:click={handleExcelDownload}
                    class="bg-white hover:bg-gray-100 text-green-600 border border-green-600 px-3 py-1 text-sm rounded"
                    >엑셀 다운로드</button
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
                        <th class="border border-gray-300 px-2 py-1"
                            >프로젝트 ID</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >프로젝트명</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >업무그룹 ID</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >업무그룹명</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >주담당자</th
                        >
                        <th class="border border-gray-300 px-2 py-1">구분</th>
                        <th class="border border-gray-300 px-2 py-1"
                            >대상서비스수</th
                        >
                        <th class="border border-gray-300 px-2 py-1">Host IP</th
                        >
                        <th class="border border-gray-300 px-2 py-1">Port</th>
                        <th class="border border-gray-300 px-2 py-1"
                            >서비스ID/URI</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >서비스명(한글)</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >서비스명(영문)</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >서비스종류</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >누적건수</th
                        >
                    </tr>
                </thead>
                <tbody class="bg-white">
                    {#each businessItems as item (item.PKEY || item._tempId)}
                        <tr class="hover:bg-blue-50">
                            <td
                                class="border border-gray-300 px-2 py-1 text-center"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(
                                        item.PKEY || item._tempId,
                                    )}
                                    on:change={() =>
                                        toggleOne(item.PKEY || item._tempId)}
                                />
                            </td>
                            <td class="border border-gray-300 px-2 py-1">
                                {item.PRJ_ID}
                            </td>
                            <td
                                class="border border-gray-300 px-2 py-1 disabled:opacity-50"
                            >
                                {projects.find((p) => p.PRJ_ID == item.PRJ_ID)
                                    ?.PRJ_NM || ""}
                            </td>
                            <td
                                class="border border-gray-300 px-2 py-1 disabled:opacity-50"
                            >
                                {item.APP_ID}
                            </td>
                            <td class="border border-gray-300 px-2 py-1">
                                <input
                                    type="text"
                                    class="w-full border-none bg-transparent focus:ring-1"
                                    bind:value={item.APPNM}
                                />
                            </td>
                            <td class="border border-gray-300 px-2 py-1">
                                <input
                                    type="text"
                                    class="w-full border-none bg-transparent focus:ring-1"
                                    bind:value={item.MAIN_MGR}
                                />
                            </td>
                            <td class="border border-gray-300 px-2 py-1">
                                <input
                                    type="text"
                                    class="w-full border-none bg-transparent focus:ring-1"
                                    bind:value={item.GUBUN}
                                />
                            </td>
                            <td class="border border-gray-300 px-2 py-1">
                                <input
                                    type="text"
                                    class="w-full border-none bg-transparent focus:ring-1"
                                    bind:value={item.SCNT}
                                />
                            </td>
                            <td class="border border-gray-300 px-2 py-1">
                                <input
                                    type="text"
                                    class="w-full border-none bg-transparent focus:ring-1"
                                    bind:value={item.HOST_IP}
                                />
                            </td>
                            <td class="border border-gray-300 px-2 py-1">
                                <input
                                    type="text"
                                    class="w-full border-none bg-transparent focus:ring-1"
                                    bind:value={item.HOST_PORT}
                                />
                            </td>
                            <td class="border border-gray-300 px-2 py-1"
                                ><input
                                    type="text"
                                    class="w-full border-none bg-transparent focus:ring-1"
                                    bind:value={item.SVC_URI}
                                />
                            </td>
                            <td class="border border-gray-300 px-2 py-1"
                                ><input
                                    type="text"
                                    class="w-full border-none bg-transparent focus:ring-1"
                                    bind:value={item.SVC_KR_NM}
                                /></td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                ><input
                                    type="text"
                                    class="w-full border-none bg-transparent focus:ring-1"
                                    bind:value={item.SVC_EN_NM}
                                /></td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                ><input
                                    type="text"
                                    class="w-full border-none bg-transparent focus:ring-1"
                                    bind:value={item.SVC_KIND}
                                /></td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                ><input
                                    type="text"
                                    class="w-full border-none bg-transparent focus:ring-1"
                                    bind:value={item.CUMCNT}
                                /></td
                            >
                        </tr>
                    {/each}
                    {#if businessItems.length === 0}
                        <tr
                            ><td
                                colspan="16"
                                class="text-center py-4 border border-gray-300"
                                >데이터가 없습니다.</td
                            ></tr
                        >
                    {/if}
                </tbody>
            </table>
        </div>
    </div>
</div>

<style>
    /* Add any custom styles here if needed */
</style>
