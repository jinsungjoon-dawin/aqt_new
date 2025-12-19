<script>
    import { onMount } from "svelte";
    import { rooturl } from "../aqtstore";
    import * as XLSX from "xlsx";

    let projects = [];
    let isLoading = false;
    let errorMessage = "";

    // Top Form Data
    let currentProject = {
        project_id: "",
        project_name: "",
        default_encoding: "",
        test_id: "",
        prototype: "0",
        compression: "0",
        virtual_col1: "",
        virtual_col2: "",
        failure_cond: "",
        aqt_type: "TMAX",
        p_type: "0",
        dstf: "",
        other_opt: "",
        t_code: "",
        dst_lp: "", // dstlp from image
        dst_port: "",
        svc_id: "",
        other_cond: "",
        no_rcv: false,
        db_skip: "N",
        max_cnt: "",
        dstv: "",
        job_id: "",
        order_opt: "",
        scrip: "",
        conn: "",
    };

    // Filters for Bottom Grid
    let searchType = "all";
    let searchKeyword = "";
    let selectedIds = new Set();

    // Mock Data for demonstration
    onMount(() => {
        // fetchProjects();
        projects = [
            {
                id: "P001",
                project_name: "Project A",
                work_group: "Group 1",
                target_sys: "Sys A",
                application: "App A",
                module: "Mod A",
                ovov_id: "O1",
                ovov_group: "OG1",
                manager: "Manager 1",
                host_ip: "127.0.0.1",
                port: "8080",
                svc_id_uri: "/svc1",
                svc_name_kr: "서비스1",
                svc_name_en: "Service1",
                svc_type: "Type A",
            },
            {
                id: "P002",
                project_name: "Project B",
                work_group: "Group 2",
                target_sys: "Sys B",
                application: "App B",
                module: "Mod B",
                ovov_id: "O2",
                ovov_group: "OG2",
                manager: "Manager 2",
                host_ip: "127.0.0.1",
                port: "8081",
                svc_id_uri: "/svc2",
                svc_name_kr: "서비스2",
                svc_name_en: "Service2",
                svc_type: "Type B",
            },
        ];
    });

    async function fetchProjects() {
        try {
            isLoading = true;
            const res = await fetch(
                `${$rooturl}/project/list?type=${searchType}&keyword=${searchKeyword}`,
            );
            if (res.ok) {
                projects = await res.json();
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

    function handleGridRowClick(project) {
        // Map grid row data to top form
        // In a real app, you might fetch full details by ID.
        // Here we just map what we have or reset if fields are missing in grid data
        currentProject = {
            ...currentProject, // keep defaults
            project_id: project.id,
            project_name: project.project_name,
            // map other fields as needed
        };
    }

    function resetForm() {
        currentProject = {
            project_id: "",
            project_name: "",
            default_encoding: "",
            test_id: "",
            prototype: "0",
            compression: "0",
            virtual_col1: "",
            virtual_col2: "",
            failure_cond: "",
            aqt_type: "TMAX",
            p_type: "0",
            dstf: "",
            other_opt: "",
            t_code: "",
            dst_lp: "",
            dst_port: "",
            svc_id: "",
            other_cond: "",
            no_rcv: false,
            db_skip: "N",
            max_cnt: "",
            dstv: "",
            job_id: "",
            order_opt: "",
            scrip: "",
            conn: "",
        };
    }

    async function handleTopSearch() {
        // Example: Fetch specific project detail by ID if selected, or just refresh list
        // Assuming there is a selected project ID in the dropdown (mocked as '프로젝트 선택' for now)
        // For DB ready, we might want to fetch details for editing
        alert(
            "상단 조회: 선택된 프로젝트 상세정보를 조회합니다. (DB 연결 시 구현)",
        );
        // Logic:
        // const res = await fetch(`${$rooturl}/project/detail?id=${selectedTopProjectId}`);
        // currentProject = await res.json();
    }

    async function handleTopSave() {
        if (!currentProject.project_name) {
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
                // fetchProjects(); // Refresh list if needed
            } else {
                const text = await res.text();
                alert(`저장 실패: ${text}`);
            }
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        }
    }

    function toggleAll(event) {
        if (event.target.checked) {
            selectedIds = new Set(projects.map((p) => p.id));
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
    function handleGridAdd() {
        resetForm();
        currentProject.project_id = "자동생성";
        alert("추가 버튼 클릭: 폼 초기화 됨");
    }

    function handleGridDelete() {
        alert("삭제 버튼 클릭: " + Array.from(selectedIds).join(", "));
    }

    async function handleGridSave() {
        // Filter modified or new items if needed, or save entire list
        // For this example, we'll save the whole list or selected items logic can be added
        if (!confirm("리스트 변경사항을 저장하시겠습니까?")) return;

        try {
            const res = await fetch(`${$rooturl}/project/saveList`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(projects),
            });

            if (res.ok) {
                alert("리스트가 저장되었습니다.");
                // fetchProjects();
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
        const ws = XLSX.utils.json_to_sheet(projects);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ProjectList");
        XLSX.writeFile(wb, "ProjectList.xlsx");
    }
</script>

<div class="container mx-auto p-4 lg:p-6 bg-gray-50 min-h-screen">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-800">프로젝트 정보</h2>
    </div>

    <!-- Top Section: Form -->
    <div class="bg-white shadow border border-gray-300 p-4 mb-6">
        <div class="flex justify-end mb-2 space-x-2">
            <div class="flex items-center">
                <span class="mr-2 text-sm font-bold text-gray-600"
                    >프로젝트</span
                >
                <select
                    class="border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100"
                >
                    <option>프로젝트 선택</option>
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
                    bind:value={currentProject.project_id}
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
                    bind:value={currentProject.project_name}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >기본 Encoding</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="기본 Encoding 입력"
                    bind:value={currentProject.default_encoding}
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
                    bind:value={currentProject.test_id}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >protoType</label
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
                    bind:value={currentProject.compression}
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
                    bind:value={currentProject.aqt_type}
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
                    >pType</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    bind:value={currentProject.p_type}
                >
                    <option value="0">0:Tcpdump</option>
                    <option value="1">1:nettl</option>
                    <option value="3">3:snoop</option>
                </select>
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >dstf</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="패킷파일명(ptype이 F인 경우)"
                    bind:value={currentProject.dstf}
                />
            </div>

            <!-- Row 5 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >otherOpt</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="Tcpdump 에 추가할 옵션 예:"
                    bind:value={currentProject.other_opt}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >tCode</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="AQT에 등록된 test id"
                    bind:value={currentProject.t_code}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >dstIp</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="응답대상 ip"
                    bind:value={currentProject.dst_lp}
                />
            </div>

            <!-- Row 6 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >dstPort</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="응답 port"
                    bind:value={currentProject.dst_port}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >svcId</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="uri (서비스 id) 필터 : tuxedo"
                    bind:value={currentProject.svc_id}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >otherCond</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="예 : ' && (port 80 || 8080) '"
                    bind:value={currentProject.other_cond}
                />
            </div>

            <!-- Row 7 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >noRcv</label
                >
                <div
                    class="flex-1 flex items-center border border-gray-300 py-1 px-2 bg-white"
                >
                    <span class="text-xs text-gray-500 mr-2"
                        >송신만 캡쳐하고 수신은 skip</span
                    >
                    <input
                        type="checkbox"
                        bind:checked={currentProject.no_rcv}
                    />
                </div>
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >dbskip</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="(Y 인 경우 AQTDB 에 저장하지 않음)"
                    bind:value={currentProject.db_skip}
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
                    placeholder="최대 수집건수"
                    bind:value={currentProject.max_cnt}
                />
            </div>

            <!-- Row 8 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >dstv</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="dstv 입력"
                    bind:value={currentProject.dstv}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >jobId</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="Job ID 입력"
                    bind:value={currentProject.job_id}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >orderOpt</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="orderOpt 입력"
                    bind:value={currentProject.order_opt}
                />
            </div>

            <!-- Row 9 -->
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >scrip</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="scrip 입력"
                    bind:value={currentProject.scrip}
                />
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >conn</label
                >
                <input
                    type="text"
                    class="flex-1 border border-gray-300 py-1 px-2"
                    placeholder="conn 입력"
                    bind:value={currentProject.conn}
                />
            </div>
        </div>
    </div>

    <!-- Bottom Section: Grid -->
    <div class="bg-white p-4 shadow border border-gray-300">
        <div class="flex justify-between items-center mb-4">
            <div class="space-x-2">
                <button
                    class="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 text-sm rounded"
                    >엑셀 업로드</button
                >
                <button
                    on:click={handleExcelDownload}
                    class="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 text-sm rounded"
                    >엑셀다운로드</button
                >
            </div>

            <div class="flex space-x-2 items-center">
                <select
                    class="border border-gray-300 rounded px-2 py-1 text-sm"
                    bind:value={searchType}
                >
                    <option value="all">전체</option>
                    <option value="project_name">프로젝트명</option>
                </select>
                <input
                    type="text"
                    class="border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="필드명 입력"
                    bind:value={searchKeyword}
                />
                <button
                    on:click={fetchProjects}
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
                            >c_target_sys_c (업무명)</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >c_application_c</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >c_module_c</th
                        >
                        <th class="border border-gray-300 px-2 py-1">ovov_id</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >ovov_group</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >주담당자</th
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
                    </tr>
                </thead>
                <tbody class="bg-white">
                    {#each projects as project (project.id)}
                        <tr
                            class="hover:bg-blue-50 cursor-pointer"
                            on:click={() => handleGridRowClick(project)}
                        >
                            <td
                                class="border border-gray-300 px-2 py-1"
                                on:click|stopPropagation
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(project.id)}
                                    on:change={() => toggleOne(project.id)}
                                />
                            </td>
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.id}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.project_name}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.work_group}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.target_sys}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.application}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.module}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.ovov_id}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.ovov_group}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.manager}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.host_ip}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.port}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.svc_id_uri}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.svc_name_kr}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.svc_name_en}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{project.svc_type}</td
                            >
                        </tr>
                    {/each}
                    {#if projects.length === 0}
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
