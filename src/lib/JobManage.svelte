<script>
    import { onMount } from "svelte";
    import { rooturl } from "../aqtstore";
    import { read, utils, writeFile } from "xlsx";

    // 프로젝트 및 업무 목록 데이터
    let projects = [];
    let jobs = [];

    // 전문 테이블 데이터
    let allMessageList = [];
    let filteredMessageList = [];

    // 선택된 전문 상태
    let selectedMessage = null;

    // 전문 필드 데이터
    let fieldList = [];
    let allFieldList = []; // If we want to keep a cache, or just use fieldList for current message

    // Search Filters
    let selectedProject = "";
    let selectedJob = "";

    // Field Search
    let searchFieldType = "";
    let searchFieldKeyword = "";
    let appliedFieldKeyword = "";
    let appliedFieldType = "";

    onMount(async () => {
        await loadMetadata();
        await loadMessages();
    });

    async function loadMetadata() {
        try {
            const projectRes = await fetch($rooturl + "/jobs/project/list");
            projects = await projectRes.json();

            const jobRes = await fetch($rooturl + "/jobs/job/list");
            jobs = await jobRes.json();
        } catch (error) {
            console.error("메타데이터 로딩 실패:", error);
        }
    }

    async function loadMessages() {
        try {
            const res = await fetch($rooturl + "/jobs/message/list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            allMessageList = await res.json();
            jobSearch(); // Apply filters
        } catch (error) {
            console.error("전문 목록 로딩 실패:", error);
        }
    }

    // 선택된 프로젝트에 따라 업무 목록 필터링
    let filteredJobs = [];
    $: filteredJobs = selectedProject
        ? jobs.filter((j) => j.projectId === selectedProject)
        : jobs;

    function jobSearch() {
        filteredMessageList = allMessageList.filter((msg) => {
            let matchesProject = selectedProject
                ? msg.projectId === selectedProject
                : true;
            let matchesJob = selectedJob
                ? msg.jobId === selectedJob // Changed to match backend model (jobId)
                : true;
            return matchesProject && matchesJob;
        });
        selectedMessage = null; // 조회 시 선택 상태 초기화
        fieldList = [];
    }

    async function jobSelect(msg) {
        selectedMessage = msg;
        searchFieldType = "";
        searchFieldKeyword = "";

        // Load fields for this message
        await loadFields(msg.messageId);
    }

    async function loadFields(messageId) {
        try {
            const res = await fetch($rooturl + "/jobs/field/list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId }),
            });
            fieldList = await res.json();
            // Reset checked status or other UI states if needed
        } catch (error) {
            console.error("필드 목록 로딩 실패:", error);
            fieldList = [];
        }
    }

    function handleMessageAdd() {
        // Logic to add a new empty row
        const newMsg = {
            projectId: selectedProject || "",
            projectName:
                projects.find((p) => p.id === selectedProject)?.name || "",
            jobGroupId: "GRP" + (selectedJob || "000"), // Simple mock logic
            jobName: jobs.find((j) => j.id === selectedJob)?.name || "",
            jobId: selectedJob || "",
            messageId: "", // Empty for new
            messageNameKr: "",
            messageNameEn: "",
            messageType: "요청",
            format: "JSON",
            direction: "IN",
            totalLength: "0",
            description: "",
            isChecked: true,
            status: "N",
        };
        allMessageList = [...allMessageList, newMsg];
        jobSearch();
    }

    async function handleMessageSave() {
        const checkedMessages = filteredMessageList.filter((m) => m.isChecked);
        if (checkedMessages.length === 0) {
            alert("저장할 전문을 선택해주세요.");
            return;
        }

        // 유효성 검사
        const invalidMessages = checkedMessages.filter(
            (m) => !m.projectId || !m.jobId,
            // Add other mandatory checks
        );

        if (invalidMessages.length > 0) {
            alert("필수 항목(프로젝트, 업무 등)이 누락된 항목이 있습니다.");
            return;
        }

        try {
            const res = await fetch($rooturl + "/jobs/message/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(checkedMessages),
            });
            const result = await res.json();
            alert(`${result.count}건의 전문이 저장되었습니다.`);
            await loadMessages(); // Reload to get generated IDs and clean status
        } catch (error) {
            console.error("전문 저장 실패:", error);
            alert("저장 중 오류가 발생했습니다.");
        }
    }

    async function handleMessageDelete() {
        const checkedMessages = filteredMessageList.filter((m) => m.isChecked);
        if (checkedMessages.length === 0) {
            alert("삭제할 전문을 선택해주세요.");
            return;
        }

        if (!confirm(`${checkedMessages.length}건의 전문을 삭제하시겠습니까?`))
            return;

        try {
            // Separate 'N' (just remove from list) and others (call API)
            const newItems = checkedMessages.filter((m) => m.status === "N");
            const persistedItems = checkedMessages.filter(
                (m) => m.status !== "N",
            );

            if (persistedItems.length > 0) {
                const res = await fetch($rooturl + "/jobs/message/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(persistedItems),
                });
                await res.json();
            }

            // Reload or Client-side update
            alert("삭제되었습니다.");
            await loadMessages();
        } catch (error) {
            console.error("전문 삭제 실패:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    }

    let messageListFileInput;
    let fieldListFileInput;

    function handleExcelUpload() {
        messageListFileInput.click();
    }

    function handleMessageListFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = utils.sheet_to_json(worksheet);

            const newMessages = jsonData.map((row) => ({
                projectId: row["프로젝트 ID"] || "",
                projectName: row["프로젝트명"] || "",
                jobGroupId: row["업무그룹ID"] || "",
                jobName: row["c_target_sys_c(업무명)"] || "",
                messageId: "", // 업로드 시 PK이므로 항상 비워둠
                messageNameKr: row["전문명(한글)"] || "",
                messageNameEn: row["전문명(영문)"] || "",
                messageType: ["요청", "응답"].includes(row["전문유형"])
                    ? row["전문유형"]
                    : "요청",
                format: ["JSON", "XML", "FIXED"].includes(row["포맷"])
                    ? row["포맷"]
                    : "JSON",
                direction: ["IN", "OUT"].includes(row["방향"])
                    ? row["방향"]
                    : "IN",
                totalLength: String(row["전체길이"] || "0").replace(
                    /[^0-9]/g,
                    "",
                ), // 숫자만 허용
                description: row["설명"] || "",
                isChecked: true,
                status: "N", // New
            }));

            allMessageList = [...allMessageList, ...newMessages];
            jobSearch(); // Refresh filtered list
            alert(`${newMessages.length}건의 전문이 업로드되었습니다.`);
            messageListFileInput.value = ""; // Reset input
        };
        reader.readAsArrayBuffer(file);
    }

    function handleExcelDownload() {
        const ws = utils.json_to_sheet(
            filteredMessageList.map((msg) => ({
                "프로젝트 ID": msg.projectId,
                프로젝트명: msg.projectName,
                업무그룹ID: msg.jobGroupId,
                "c_target_sys_c(업무명)": msg.jobName,
                전문ID: msg.messageId,
                "전문명(한글)": msg.messageNameKr,
                "전문명(영문)": msg.messageNameEn,
                전문유형: msg.messageType,
                포맷: msg.format,
                방향: msg.direction,
                전체길이: msg.totalLength,
                설명: msg.description,
            })),
        );
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Message_List");
        writeFile(wb, "Message_List.xlsx");
    }

    // --- Field Logic ---

    // 필드 검색 반응형 업데이트 (Client-side filtering of loaded fields)
    let filteredFieldList = [];
    $: {
        if (appliedFieldType && appliedFieldKeyword) {
            filteredFieldList = fieldList.filter((field) => {
                if (appliedFieldType === "fieldName") {
                    return (
                        (field.fieldNameKor &&
                            field.fieldNameKor.includes(appliedFieldKeyword)) ||
                        (field.fieldNameEng &&
                            field.fieldNameEng.includes(appliedFieldKeyword))
                    );
                }
                return true;
            });
        } else {
            filteredFieldList = fieldList;
        }
    }

    function handleFieldSearchTrigger() {
        appliedFieldType = searchFieldType;
        appliedFieldKeyword = searchFieldKeyword;
    }

    // 필드 전체 선택/해제
    let isAllFieldsChecked = false;
    $: if (filteredFieldList.length > 0) {
        isAllFieldsChecked = filteredFieldList.every((f) => f.isChecked);
    } else {
        isAllFieldsChecked = false;
    }

    function toggleAllFields(e) {
        const checked = e.target.checked;
        isAllFieldsChecked = checked;
        fieldList = fieldList.map((f) => ({ ...f, isChecked: checked }));
    }

    function handleFieldAdd() {
        if (!selectedMessage) {
            alert("먼저 전문을 선택해주세요.");
            return;
        }

        const newField = {
            projectId: selectedMessage.projectId,
            messageId: selectedMessage.messageId,
            fieldId: "",
            fieldNameEng: "",
            fieldNameKor: "",
            fieldType: "STRING",
            fieldLength: "0",
            fieldDesc: "",
            segment: "Root",
            startPos: "0",
            loopCount: "1",
            order: (fieldList.length + 1).toString(),
            mandatory: "N",
            defaultValue: "",
            formatPattern: "",
            codeSet: "",
            masking: "N",
            remarks: "",
            isChecked: true,
            status: "N", // New
        };

        fieldList = [...fieldList, newField];
    }

    async function handleFieldDelete() {
        if (!selectedMessage) return;

        const checkedFields = fieldList.filter((f) => f.isChecked);
        if (checkedFields.length === 0) {
            alert("삭제할 필드를 선택해주세요.");
            return;
        }

        if (!confirm(`${checkedFields.length}개의 필드를 삭제하시겠습니까?`))
            return;

        try {
            const newItems = checkedFields.filter((f) => f.status === "N");
            const persistedItems = checkedFields.filter(
                (f) => f.status !== "N",
            );

            if (persistedItems.length > 0) {
                await fetch($rooturl + "/jobs/field/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(persistedItems),
                });
            }

            alert("삭제되었습니다.");
            await loadFields(selectedMessage.messageId);
        } catch (error) {
            console.error("필드 삭제 실패:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    }

    async function handleFieldSave() {
        if (!selectedMessage) return;

        const checkedFields = fieldList.filter((f) => f.isChecked);
        if (checkedFields.length === 0) {
            alert("저장할 필드를 선택해주세요.");
            return;
        }

        // 중복 검사 (Simple client-side check)
        const duplicateNames = new Set();
        const seenNames = new Set();
        // Check only within the current list (including existing)
        fieldList.forEach((f) => {
            if (f.status === "D") return; // Skip deleted
            if (f.fieldNameEng && seenNames.has(f.fieldNameEng)) {
                duplicateNames.add(f.fieldNameEng);
            }
            if (f.fieldNameEng) seenNames.add(f.fieldNameEng);
        });

        // This simple check might be too aggressive if 'save' only sends checked ones but validation checks all.
        // Let's assume server validation handles robust unique checks, or simple check here.
        // For now, proceed.

        try {
            const res = await fetch($rooturl + "/jobs/field/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(checkedFields),
            });
            const result = await res.json();
            alert(`${result.count}건의 필드가 저장되었습니다.`);
            await loadFields(selectedMessage.messageId);
        } catch (error) {
            console.error("필드 저장 실패:", error);
            alert("저장 중 오류가 발생했습니다.");
        }
    }

    function handleFieldExcelUpload() {
        if (!selectedMessage) {
            alert("먼저 전문을 선택해주세요.");
            return;
        }
        fieldListFileInput.click();
    }

    function handleFieldListFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = utils.sheet_to_json(worksheet);

            const newFields = jsonData.map((row) => ({
                projectId:
                    row["프로젝트 ID"] || selectedMessage?.projectId || "",
                projectName:
                    row["프로젝트명"] || selectedMessage?.projectName || "",
                jobGroupId:
                    row["업무그룹ID"] || selectedMessage?.jobGroupId || "",
                messageId: row["전문ID"] || selectedMessage.messageId,
                messageName:
                    row["전문Name"] || selectedMessage?.messageNameKr || "",
                fieldId: "",
                fieldNameEng: row["필드명(영문)"] || "",
                fieldNameKor: row["필드명(한글)"] || "",
                fieldType: (row["필드타입"] || "STRING").toUpperCase(),
                fieldDigits: String(row["필드자리수"] || "0").replace(
                    /[^0-9]/g,
                    "",
                ),
                fieldLength: String(row["필드길이"] || "0").replace(
                    /[^0-9]/g,
                    "",
                ),
                fieldDesc: row["필드설명"] || "",
                segment: row["세그먼트"] || "Root",
                startPos: String(row["시작위치"] || "0").replace(/[^0-9]/g, ""),
                loopCount: String(row["반복횟수"] || "1").replace(
                    /[^0-9]/g,
                    "",
                ),
                order: String(
                    row["순서"] || (fieldList.length + 1).toString(),
                ).replace(/[^0-9]/g, ""),
                mandatory: ["Y", "N"].includes(row["필수여부"])
                    ? row["필수여부"]
                    : "N",
                defaultValue: row["기본값"] || "",
                formatPattern: row["포맷/패턴"] || "",
                codeSet: row["코드셋"] || "",
                masking: ["Y", "N"].includes(row["마스킹여부"])
                    ? row["마스킹여부"]
                    : "N",
                remarks: row["비고"] || "",
                isChecked: true,
                status: "N",
            }));

            // 중복 확인 없이 무조건 추가 (사용자 요청)
            allFieldList = [...allFieldList, ...newFields];

            alert(`${newFields.length}건의 필드가 추가되었습니다.`);
            fieldListFileInput.value = "";
        };
        reader.readAsArrayBuffer(file);
    }

    function handleFieldExcelDownload() {
        if (!selectedMessage) {
            alert("먼저 전문을 선택해주세요.");
            return;
        }
        const ws = utils.json_to_sheet(
            fieldList.map((field) => ({
                "프로젝트 ID": field.projectId,
                프로젝트명: field.projectName,
                업무그룹ID: field.jobGroupId,
                전문ID: field.messageId,
                전문Name: field.messageName,
                전문필드ID: field.fieldId,
                "필드명(영문)": field.fieldNameEng,
                "필드명(한글)": field.fieldNameKor,
                필드타입: field.fieldType,
                필드자리수: field.fieldDigits,
                필드설명: field.fieldDesc,
                세그먼트: field.segment,
                시작위치: field.startPos,
                필드길이: field.fieldLength,
                반복횟수: field.loopCount,
                순서: field.order,
                필수여부: field.mandatory,
                기본값: field.defaultValue,
                "포맷/패턴": field.formatPattern,
                코드셋: field.codeSet,
                마스킹여부: field.masking,
                비고: field.remarks,
            })),
        );
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Message_Fields");
        writeFile(wb, "Message_Fields.xlsx");
    }
</script>

<!-- container mx-auto p-4 lg:p-8 bg-gray-50 min-h-screen -->
<div
    class="container mx-auto p-4 lg:p-8 bg-gray-50 flex flex-col h-[calc(100vh-4.1rem)] bg-gray-50 p-4 lg:p-8 gap-4"
>
    <!-- Top Pane: Message List (50%) -->
    <div
        class="flex-1 flex flex-col bg-white border border-gray-300 rounded shadow overflow-hidden"
    >
        <!-- Header Section -->
        <div
            class="p-4 border-b border-gray-200 bg-gray-100 flex flex-wrap justify-between items-center gap-2"
        >
            <h2 class="text-xl font-bold text-gray-700">전문 등록</h2>
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

                <div class="flex gap-1 ml-2">
                    <button
                        on:click={jobSearch}
                        class="bg-white hover:bg-blue-50 text-blue-600 font-semibold hover:text-blue-700 px-3 py-1 text-xs rounded border border-blue-300 hover:border-blue-400 transition"
                    >
                        조회
                    </button>
                    <!-- <button
                        on:click={handleMessageAdd}
                        class="bg-white hover:bg-blue-50 text-blue-600 font-semibold hover:text-blue-700 px-3 py-1 text-xs rounded border border-blue-300 hover:border-blue-400 transition"
                    >
                        추가
                    </button>
                    <button
                        on:click={handleMessageDelete}
                        class="bg-white hover:bg-red-50 text-red-600 font-semibold hover:text-red-700 px-3 py-1 text-xs rounded border border-red-300 hover:border-red-400 transition"
                    >
                        삭제
                    </button>  -->
                    <button
                        on:click={handleMessageSave}
                        class="bg-white hover:bg-blue-50 text-blue-600 font-semibold hover:text-blue-700 px-3 py-1 text-xs rounded border border-blue-300 hover:border-blue-400 transition"
                    >
                        저장
                    </button>
                    <div class="w-px h-6 bg-gray-300 mx-1"></div>
                    <!-- 엑셀 버튼 (헤더로 이동) -->
                    <button
                        on:click={handleExcelUpload}
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

        <!-- Data Table -->
        <div class="flex-1 overflow-auto">
            <table class="min-w-full border-collapse text-sm whitespace-nowrap">
                <thead
                    class="bg-gray-50 text-gray-700 sticky top-0 z-10 shadow-sm"
                >
                    <tr>
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100 w-8"
                        >
                            <input type="checkbox" disabled />
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
                            >업무그룹ID</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >c_target_sys_c(업무명)</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >전문ID</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >전문명(한글)</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >전문명(영문)</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >전문유형</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >포맷</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >방향</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >전체길이</th
                        >
                        <th
                            class="border-b border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >설명</th
                        >
                    </tr>
                </thead>
                <tbody class="bg-white">
                    {#each filteredMessageList as msg}
                        <tr
                            class="hover:bg-blue-50 transition-colors border-b border-gray-200 cursor-pointer {selectedMessage ===
                            msg
                                ? 'bg-blue-100'
                                : ''}"
                            on:click={() => jobSelect(msg)}
                        >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                            >
                                <input
                                    type="checkbox"
                                    bind:checked={msg.isChecked}
                                    on:click|stopPropagation
                                />
                            </td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center font-semibold {msg.status ===
                                'D'
                                    ? 'text-red-500'
                                    : msg.status === 'N'
                                      ? 'text-green-600'
                                      : 'text-gray-600'}">{msg.status}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{msg.projectId}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{msg.projectName}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{msg.jobGroupId}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{msg.jobName}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{msg.messageId}</td
                            >
                            <!-- <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                contenteditable="true"
                                bind:textContent={msg.messageId}
                            ></td> -->
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-left"
                                contenteditable="true"
                                bind:textContent={msg.messageNameKr}
                                on:input={() => (msg.isChecked = true)}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-left"
                                contenteditable="true"
                                bind:textContent={msg.messageNameEn}
                                on:input={() => (msg.isChecked = true)}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center p-0"
                            >
                                <select
                                    bind:value={msg.messageType}
                                    on:change={() => (msg.isChecked = true)}
                                    class="w-full h-full border-none focus:ring-0 bg-transparent text-center"
                                >
                                    <option value="요청">요청</option>
                                    <option value="응답">응답</option>
                                </select>
                            </td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center p-0"
                            >
                                <select
                                    bind:value={msg.format}
                                    on:change={() => (msg.isChecked = true)}
                                    class="w-full h-full border-none focus:ring-0 bg-transparent text-center"
                                >
                                    <option value="JSON">JSON</option>
                                    <option value="XML">XML</option>
                                    <option value="FIXED">FIXED</option>
                                </select>
                            </td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center p-0"
                            >
                                <select
                                    bind:value={msg.direction}
                                    on:change={() => (msg.isChecked = true)}
                                    class="w-full h-full border-none focus:ring-0 bg-transparent text-center"
                                >
                                    <option value="IN">IN</option>
                                    <option value="OUT">OUT</option>
                                </select>
                            </td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-right"
                                contenteditable="true"
                                bind:textContent={msg.totalLength}
                                on:input={(e) => {
                                    msg.isChecked = true;
                                    const cleaned =
                                        e.target.textContent.replace(
                                            /[^0-9]/g,
                                            "",
                                        );
                                    if (e.target.textContent !== cleaned) {
                                        e.target.textContent = cleaned;
                                        msg.totalLength = cleaned;
                                        // Move cursor to end
                                        const range = document.createRange();
                                        const sel = window.getSelection();
                                        range.selectNodeContents(e.target);
                                        range.collapse(false);
                                        sel.removeAllRanges();
                                        sel.addRange(range);
                                    }
                                }}
                            ></td>
                            <td
                                class="px-2 py-1 text-left"
                                contenteditable="true"
                                bind:textContent={msg.description}
                                on:input={() => (msg.isChecked = true)}
                            ></td>
                        </tr>
                    {/each}
                    {#if filteredMessageList.length === 0}
                        <tr>
                            <td
                                class="px-2 py-4 text-center text-gray-500"
                                colspan="13"
                            >
                                데이터가 없습니다.
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>
    </div>

    <!-- Bottom Pane: Message Fields (50%) -->
    <div
        class="flex-1 flex flex-col bg-white border border-gray-300 rounded shadow overflow-hidden"
    >
        <!-- Header Section -->
        <div
            class="p-4 border-b border-gray-200 bg-gray-100 flex flex-wrap justify-between items-center gap-2"
        >
            <div class="flex items-center gap-2">
                <h3 class="text-xl font-bold text-gray-700">
                    전문 필드 {#if selectedMessage}({selectedMessage.messageId}){/if}
                </h3>
            </div>

            <div class="flex gap-1">
                <select
                    bind:value={searchFieldType}
                    class="border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-blue-500 ml-4"
                >
                    <option value="">전체</option>
                    <option value="fieldName">필드명</option>
                </select>
                <input
                    type="text"
                    bind:value={searchFieldKeyword}
                    placeholder="필드명 입력"
                    class="border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                    on:click={handleFieldSearchTrigger}
                    class="bg-white hover:bg-blue-50 text-blue-600 font-semibold hover:text-blue-700 px-3 py-1 text-xs rounded border border-blue-300 hover:border-blue-400 transition"
                >
                    조회
                </button>
                <button
                    on:click={handleFieldAdd}
                    class="bg-white hover:bg-blue-50 text-blue-600 font-semibold hover:text-blue-700 px-3 py-1 text-xs rounded border border-blue-300 hover:border-blue-400 transition"
                >
                    추가
                </button>
                <button
                    on:click={handleFieldDelete}
                    class="bg-white hover:bg-red-50 text-red-600 font-semibold hover:text-red-700 px-3 py-1 text-xs rounded border border-red-300 hover:border-red-400 transition"
                >
                    삭제
                </button>
                <button
                    on:click={handleFieldSave}
                    class="bg-white hover:bg-blue-50 text-blue-600 font-semibold hover:text-blue-700 px-3 py-1 text-xs rounded border border-blue-300 hover:border-blue-400 transition"
                >
                    저장
                </button>
                <div class="w-px h-6 bg-gray-300 mx-1"></div>
                <!-- Separator -->
                <button
                    on:click={handleFieldExcelUpload}
                    class="bg-white hover:bg-green-50 text-green-600 font-semibold hover:text-green-700 px-3 py-1 text-xs rounded border border-green-300 hover:border-green-400 transition"
                >
                    엑셀 업로드
                </button>
                <button
                    on:click={handleFieldExcelDownload}
                    class="bg-white hover:bg-green-50 text-green-600 font-semibold hover:text-green-700 px-3 py-1 text-xs rounded border border-green-300 hover:border-green-400 transition"
                >
                    엑셀 다운로드
                </button>
            </div>
        </div>

        <!-- Data Table -->
        <div class="flex-1 overflow-auto">
            <table class="min-w-full border-collapse text-sm whitespace-nowrap">
                <thead
                    class="bg-gray-50 text-gray-700 sticky top-0 z-10 shadow-sm"
                >
                    <tr>
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100 w-8"
                            ><input
                                type="checkbox"
                                bind:checked={isAllFieldsChecked}
                                on:click={toggleAllFields}
                            /></th
                        >
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
                            >업무그룹ID</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >전문ID</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >전문Name</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >전문필드ID</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >필드명(영문)</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >필드명(한글)</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >필드타입</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >필드자리수</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >필드설명</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >세그먼트</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >시작위치</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >필드길이</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >반복횟수</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >순서</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >필수여부</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >기본값</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >포맷/패턴</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >코드셋</th
                        >
                        <th
                            class="border-b border-r border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >마스킹여부</th
                        >
                        <th
                            class="border-b border-gray-300 px-2 py-1 text-center font-semibold bg-gray-100"
                            >비고</th
                        >
                    </tr>
                </thead>
                <tbody class="bg-white">
                    {#each fieldList as field}
                        <tr
                            class="hover:bg-blue-50 transition-colors border-b border-gray-200"
                        >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                ><input
                                    type="checkbox"
                                    bind:checked={field.isChecked}
                                /></td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center font-semibold {field.status ===
                                'D'
                                    ? 'text-red-500'
                                    : field.status === 'N'
                                      ? 'text-green-600'
                                      : 'text-gray-600'}">{field.status}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{field.projectId}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{field.projectName}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{field.jobGroupId}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{field.messageId}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-left"
                                >{field.messageName}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                >{field.fieldId}</td
                            >
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-left"
                                contenteditable="true"
                                bind:textContent={field.fieldNameEng}
                                on:input={() => (field.isChecked = true)}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-left"
                                contenteditable="true"
                                bind:textContent={field.fieldNameKor}
                                on:input={() => (field.isChecked = true)}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center p-0"
                            >
                                <select
                                    bind:value={field.fieldType}
                                    on:change={() => (field.isChecked = true)}
                                    class="w-full h-full border-none focus:ring-0 bg-transparent text-center"
                                >
                                    <option value="STRING">STRING</option>
                                    <option value="NUMBER">NUMBER</option>
                                    <option value="DECIMAL">DECIMAL</option>
                                </select>
                            </td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-right"
                                contenteditable="true"
                                bind:textContent={field.fieldDigits}
                                on:input={(e) => {
                                    field.isChecked = true;
                                    const cleaned =
                                        e.target.textContent.replace(
                                            /[^0-9]/g,
                                            "",
                                        );
                                    if (e.target.textContent !== cleaned) {
                                        e.target.textContent = cleaned;
                                        field.fieldDigits = cleaned;
                                        const range = document.createRange();
                                        const sel = window.getSelection();
                                        range.selectNodeContents(e.target);
                                        range.collapse(false);
                                        sel.removeAllRanges();
                                        sel.addRange(range);
                                    }
                                }}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-left"
                                contenteditable="true"
                                bind:textContent={field.fieldDesc}
                                on:input={() => (field.isChecked = true)}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                contenteditable="true"
                                bind:textContent={field.segment}
                                on:input={(e) => {
                                    field.isChecked = true;
                                    const cleaned =
                                        e.target.textContent.replace(
                                            /[^0-9]/g,
                                            "",
                                        );
                                    if (e.target.textContent !== cleaned) {
                                        e.target.textContent = cleaned;
                                        field.segment = cleaned;
                                        const range = document.createRange();
                                        const sel = window.getSelection();
                                        range.selectNodeContents(e.target);
                                        range.collapse(false);
                                        sel.removeAllRanges();
                                        sel.addRange(range);
                                    }
                                }}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-right"
                                contenteditable="true"
                                bind:textContent={field.startPos}
                                on:input={(e) => {
                                    field.isChecked = true;
                                    const cleaned =
                                        e.target.textContent.replace(
                                            /[^0-9]/g,
                                            "",
                                        );
                                    if (e.target.textContent !== cleaned) {
                                        e.target.textContent = cleaned;
                                        field.startPos = cleaned;
                                        const range = document.createRange();
                                        const sel = window.getSelection();
                                        range.selectNodeContents(e.target);
                                        range.collapse(false);
                                        sel.removeAllRanges();
                                        sel.addRange(range);
                                    }
                                }}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-right"
                                contenteditable="true"
                                bind:textContent={field.fieldLength}
                                on:input={(e) => {
                                    field.isChecked = true;
                                    const cleaned =
                                        e.target.textContent.replace(
                                            /[^0-9]/g,
                                            "",
                                        );
                                    if (e.target.textContent !== cleaned) {
                                        e.target.textContent = cleaned;
                                        field.fieldLength = cleaned;
                                        const range = document.createRange();
                                        const sel = window.getSelection();
                                        range.selectNodeContents(e.target);
                                        range.collapse(false);
                                        sel.removeAllRanges();
                                        sel.addRange(range);
                                    }
                                }}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-right"
                                contenteditable="true"
                                bind:textContent={field.loopCount}
                                on:input={(e) => {
                                    field.isChecked = true;
                                    const cleaned =
                                        e.target.textContent.replace(
                                            /[^0-9]/g,
                                            "",
                                        );
                                    if (e.target.textContent !== cleaned) {
                                        e.target.textContent = cleaned;
                                        field.loopCount = cleaned;
                                        const range = document.createRange();
                                        const sel = window.getSelection();
                                        range.selectNodeContents(e.target);
                                        range.collapse(false);
                                        sel.removeAllRanges();
                                        sel.addRange(range);
                                    }
                                }}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-right"
                                contenteditable="true"
                                bind:textContent={field.order}
                                on:input={(e) => {
                                    field.isChecked = true;
                                    const cleaned =
                                        e.target.textContent.replace(
                                            /[^0-9]/g,
                                            "",
                                        );
                                    if (e.target.textContent !== cleaned) {
                                        e.target.textContent = cleaned;
                                        field.order = cleaned;
                                        const range = document.createRange();
                                        const sel = window.getSelection();
                                        range.selectNodeContents(e.target);
                                        range.collapse(false);
                                        sel.removeAllRanges();
                                        sel.addRange(range);
                                    }
                                }}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center p-0"
                            >
                                <select
                                    bind:value={field.mandatory}
                                    on:change={() => (field.isChecked = true)}
                                    class="w-full h-full border-none focus:ring-0 bg-transparent text-center"
                                >
                                    <option value="Y">Y</option>
                                    <option value="N">N</option>
                                </select>
                            </td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                contenteditable="true"
                                bind:textContent={field.defaultValue}
                                on:input={() => (field.isChecked = true)}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                contenteditable="true"
                                bind:textContent={field.formatPattern}
                                on:input={() => (field.isChecked = true)}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center"
                                contenteditable="true"
                                bind:textContent={field.codeSet}
                                on:input={() => (field.isChecked = true)}
                            ></td>
                            <td
                                class="border-r border-gray-200 px-2 py-1 text-center p-0"
                            >
                                <select
                                    bind:value={field.masking}
                                    on:change={() => (field.isChecked = true)}
                                    class="w-full h-full border-none focus:ring-0 bg-transparent text-center"
                                >
                                    <option value="Y">Y</option>
                                    <option value="N">N</option>
                                </select>
                            </td>
                            <td
                                class="px-2 py-1 text-left"
                                contenteditable="true"
                                bind:textContent={field.remarks}
                                on:input={() => (field.isChecked = true)}
                            ></td>
                        </tr>
                    {/each}
                    {#if fieldList.length === 0}
                        <tr>
                            <td
                                class="px-2 py-4 text-center text-gray-500"
                                colspan="22"
                            >
                                데이터가 없습니다.
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>
    </div>

    <input
        type="file"
        accept=".xlsx, .xls"
        class="hidden"
        bind:this={messageListFileInput}
        on:change={handleMessageListFileChange}
    />
    <input
        type="file"
        accept=".xlsx, .xls"
        class="hidden"
        bind:this={fieldListFileInput}
        on:change={handleFieldListFileChange}
    />
</div>
