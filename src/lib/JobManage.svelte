<script>
    import { onMount } from "svelte";
    import { read, utils, writeFile } from "xlsx";

    // 프로젝트 및 업무 목록 데이터
    let projects = [];
    let jobs = [];

    onMount(async () => {
        try {
            const projectRes = await fetch("/api/jobs/project/list");
            projects = await projectRes.json();

            const jobRes = await fetch("/api/jobs/job/list");
            jobs = await jobRes.json();
        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        }
    });

    let selectedProject = "";
    let selectedJob = "";
    let filteredJobs = [];

    // 선택된 프로젝트에 따라 업무 목록 필터링
    $: filteredJobs = selectedProject
        ? jobs.filter((j) => j.projectId === selectedProject)
        : jobs;

    // 전문 테이블 데이터
    let allMessageList = [
        {
            projectId: "1",
            projectName: "프로젝트 A",
            jobGroupId: "GRP001",
            jobName: "업무 1",
            messageId: "MSG0001",
            messageNameKr: "테스트 전문 1",
            messageNameEn: "Test Message 1",
            messageType: "요청",
            format: "JSON",
            direction: "IN",
            totalLength: "150",
            description: "테스트를 위한 요청 전문",
            isChecked: false,
            status: "R",
        },
        {
            projectId: "1",
            projectName: "프로젝트 A",
            jobGroupId: "GRP001",
            jobName: "업무 1",
            messageId: "MSG0002",
            messageNameKr: "테스트 전문 2",
            messageNameEn: "Test Message 2",
            messageType: "응답",
            format: "JSON",
            direction: "OUT",
            totalLength: "200",
            description: "테스트를 위한 응답 전문",
            isChecked: false,
            status: "R",
        },
        {
            projectId: "2",
            projectName: "프로젝트 B",
            jobGroupId: "GRP002",
            jobName: "업무 3",
            messageId: "MSG0003",
            messageNameKr: "XML 전문",
            messageNameEn: "XML Message",
            messageType: "요청",
            format: "XML",
            direction: "IN",
            totalLength: "-", // Field only
            description: "XML 형식 전문",
            isChecked: false,
            status: "R",
        },
    ];

    let filteredMessageList = [...allMessageList];

    // 선택된 전문 상태
    let selectedMessage = null; // ID 문자열에서 객체 참조로 변경

    function jobSelect(msg) {
        selectedMessage = msg;
        searchFieldType = "";
        searchFieldKeyword = "";
    }

    function jobSearch() {
        filteredMessageList = allMessageList.filter((msg) => {
            let matchesProject = selectedProject
                ? msg.projectId === selectedProject
                : true;
            let matchesJob = selectedJob
                ? msg.jobName === jobs.find((j) => j.id === selectedJob)?.name
                : true; // Using jobName for simplicity based on mock data structure
            return matchesProject && matchesJob;
        });
        selectedMessage = null; // 조회 시 선택 상태 초기화
    }

    function handleMessageSave() {
        const checkedMessages = filteredMessageList.filter((m) => m.isChecked);
        if (checkedMessages.length === 0) {
            alert("저장할 전문을 선택해주세요.");
            return;
        }

        // 유효성 검사
        // 필수: 프로젝트 ID, 프로젝트명, 업무그룹ID, 업무명
        // 전문ID는 Auto Increment로 필수 아님
        const invalidMessages = checkedMessages.filter(
            (m) =>
                !m.projectId.trim() ||
                !m.projectName.trim() ||
                !m.jobGroupId.trim() ||
                !m.jobName.trim(),
        );

        if (invalidMessages.length > 0) {
            alert(
                `필수 항목(프로젝트ID, 프로젝트명, 업무그룹ID, 업무명)이 누락된 항목이 ${invalidMessages.length}건 있습니다.\n체크된 항목의 필수 값을 모두 입력해주세요.`,
            );
            return;
        }

        console.log("Saving checked messages", checkedMessages);
        alert(
            `${checkedMessages.length}건의 전문이 콘솔에 저장되었습니다. (개발자 도구 확인)`,
        );
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
                status: "N",
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

    // 전문 필드 테스트 데이터 (원본)
    let allFieldList = [
        {
            projectId: "1",
            projectName: "프로젝트 A",
            jobGroupId: "GRP001",
            messageId: "MSG0001",
            messageName: "테스트 전문 1",
            fieldId: "FLD001",
            fieldNameEng: "Header",
            fieldNameKor: "헤더",
            fieldType: "STRING",
            fieldLength: "100",
            fieldDesc: "공통 헤더",
            segment: "Root",
            startPos: "0",
            loopCount: "1",
            order: "1",
            mandatory: "Y",
            defaultValue: "",
            formatPattern: "",
            codeSet: "",
            masking: "N",
            remarks: "",
            isChecked: false,
            status: "R",
        },
        {
            projectId: "1",
            projectName: "프로젝트 A",
            jobGroupId: "GRP001",
            messageId: "MSG0001",
            messageName: "테스트 전문 1",
            fieldId: "FLD002",
            fieldNameEng: "Body",
            fieldNameKor: "바디",
            fieldType: "STRING",
            fieldLength: "500",
            fieldDesc: "데이터 바디",
            segment: "Root",
            startPos: "100",
            loopCount: "1",
            order: "2",
            mandatory: "Y",
            defaultValue: "",
            formatPattern: "",
            codeSet: "",
            masking: "N",
            remarks: "",
            isChecked: false,
            status: "R",
        },
        {
            projectId: "1",
            projectName: "프로젝트 A",
            jobGroupId: "GRP001",
            messageId: "MSG0002",
            messageName: "테스트 전문 2",
            fieldId: "FLD011",
            fieldNameEng: "ResponseHeader",
            fieldNameKor: "응답 헤더",
            fieldType: "STRING",
            fieldLength: "100",
            fieldDesc: "응답 공통 헤더",
            segment: "Root",
            startPos: "0",
            loopCount: "1",
            order: "1",
            mandatory: "Y",
            defaultValue: "",
            formatPattern: "",
            codeSet: "",
            masking: "N",
            remarks: "",
            isChecked: false,
            status: "R",
        },
        {
            projectId: "2",
            projectName: "프로젝트 B",
            jobGroupId: "GRP002",
            messageId: "MSG0003",
            messageName: "XML 전문",
            fieldId: "FLD021",
            fieldNameEng: "RootTag",
            fieldNameKor: "루트 태그",
            fieldType: "STRING",
            fieldLength: "-",
            fieldDesc: "루트",
            segment: "Root",
            startPos: "-",
            loopCount: "1",
            order: "1",
            mandatory: "Y",
            defaultValue: "",
            formatPattern: "",
            codeSet: "",
            masking: "N",
            remarks: false,
            isChecked: false,
            status: "R",
        },
    ];

    // 전문 선택 및 조회에 따른 필드 목록 반응형 업데이트
    let fieldList = [];
    let searchFieldType = "";
    let searchFieldKeyword = "";

    let appliedFieldKeyword = "";
    let appliedFieldType = "";

    $: {
        let tempFields = selectedMessage
            ? allFieldList.filter(
                  (field) => field.messageId === selectedMessage.messageId,
              )
            : [];

        if (appliedFieldType && appliedFieldKeyword) {
            tempFields = tempFields.filter((field) => {
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
        }
        fieldList = tempFields;
    }

    function handleFieldSearchTrigger() {
        appliedFieldType = searchFieldType;
        appliedFieldKeyword = searchFieldKeyword;
    }

    // 필드 전체 선택/해제
    let isAllFieldsChecked = false;
    // fieldList 변경 시 전체 선택 상태 동기화
    $: {
        if (fieldList.length > 0) {
            isAllFieldsChecked = fieldList.every((f) => f.isChecked);
        } else {
            isAllFieldsChecked = false;
        }
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
        // 선택된 전문을 기반으로 기본값이 설정된 새 필드 생성
        const newField = {
            projectId: selectedMessage.projectId,
            projectName: selectedMessage.projectName,
            jobGroupId: selectedMessage.jobGroupId,
            messageId: selectedMessage.messageId,
            messageName: selectedMessage.messageNameKr,
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
            status: "N",
        };

        allFieldList = [...allFieldList, newField];
    }

    function handleFieldDelete() {
        if (!selectedMessage) return;

        const checkedFields = fieldList.filter((f) => f.isChecked);
        if (checkedFields.length === 0) {
            alert("삭제할 필드를 선택해주세요.");
            return;
        }

        if (confirm(`${checkedFields.length}개의 필드를 삭제하시겠습니까?`)) {
            // N인 항목은 즉시 제거, R인 항목은 D로 변경
            const toRemove = new Set(
                checkedFields.filter((f) => f.status === "N"),
            );
            const toSoftDelete = checkedFields.filter((f) => f.status !== "N");

            // N 제거
            allFieldList = allFieldList.filter((f) => !toRemove.has(f));

            // R -> D 변경
            toSoftDelete.forEach((f) => {
                f.status = "D";
                f.isChecked = false;
            });

            // Reactivity update
            allFieldList = [...allFieldList];
        }
    }

    function handleFieldSave() {
        if (!selectedMessage) return;

        const checkedFields = fieldList.filter((f) => f.isChecked);
        if (checkedFields.length === 0) {
            alert("저장할 필드를 선택해주세요.");
            return;
        }

        // 중복 검사 (프로젝트ID, 업무그룹ID, 전문ID, 필드명(영문))
        // 현재 전문의 유효한(삭제되지 않은) 필드 목록 가져오기
        const activeFields = allFieldList.filter(
            (f) =>
                f.messageId === selectedMessage.messageId && f.status !== "D",
        );

        const seenKeys = new Set();
        const duplicateNames = new Set();

        for (const field of activeFields) {
            // 키 조합 생성
            const key = `${field.projectId}|${field.jobGroupId}|${field.messageId}|${field.fieldNameEng}`;

            if (seenKeys.has(key)) {
                // 중복 발견
                duplicateNames.add(field.fieldNameEng);
            } else {
                seenKeys.add(key);
            }
        }

        if (duplicateNames.size > 0) {
            alert(
                `중복된 필드 식별자(프로젝트ID, 업무그룹ID, 전문ID, 필드명(영문))가 존재합니다.\n저장할 수 없습니다.\n\n중복 필드명: ${Array.from(duplicateNames).join(", ")}`,
            );
            return;
        }

        console.log(
            "Saving checked fields for message " + selectedMessage.messageId,
            checkedFields,
        );
        alert(
            `${checkedFields.length}건의 필드가 콘솔에 저장되었습니다. (개발자 도구 확인)`,
        );
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
