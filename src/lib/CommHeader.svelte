<script>
    import { onMount } from "svelte";
    import { rooturl } from "../aqtstore";
    import * as XLSX from "xlsx";

    let commHeaderList = [];

    // Top Form Data
    let currentHeader = {
        project: "",
        job: "",
        comm_header_id: "",
        comm_header_name_kr: "",
        comm_header_name_en: "",
        format: "Fixed",
        direction: "Inbound",
        total_length: "",
        description: "",
    };

    // Filters for Bottom Grid
    let searchType = "all";
    let searchKeyword = "";
    let selectedIds = new Set();

    onMount(() => {
        // Mock Data
        commHeaderList = [
            {
                id: "CH001",
                project_name: "Project A",
                job_group: "Job A",
                target_sys: "Sys 1",
                comm_header_id: "CH001",
                comm_header_name: "Header 1",
                field_id: "F001",
                field_name: "Length",
                field_name_en: "Len",
                field_name_kr: "길이",
                field_type: "Num",
                field_length: "4",
                field_desc: "Total Length",
                segment: "S1",
                start_pos: "0",
                seq: "1",
                mandatory: "Y",
                default: "0000",
                format: "",
                codeset: "",
                masking: "N",
                note: "",
            },
            {
                id: "CH002",
                project_name: "Project A",
                job_group: "Job A",
                target_sys: "Sys 1",
                comm_header_id: "CH001",
                comm_header_name: "Header 1",
                field_id: "F002",
                field_name: "Type",
                field_name_en: "Type",
                field_name_kr: "유형",
                field_type: "Char",
                field_length: "2",
                field_desc: "Msg Type",
                segment: "S1",
                start_pos: "4",
                seq: "2",
                mandatory: "Y",
                default: "TX",
                format: "",
                codeset: "",
                masking: "N",
                note: "",
            },
        ];
    });

    async function handleTopSearch() {
        // Search specific header details
        try {
            const res = await fetch(
                `${$rooturl}/commHeader/detail?project=${currentHeader.project}&job=${currentHeader.job}`,
            );
            if (res.ok) {
                const data = await res.json();
                currentHeader = { ...currentHeader, ...data }; // Update form
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function fetchCommHeaders() {
        try {
            const res = await fetch(
                `${$rooturl}/commHeader/list?type=${searchType}&keyword=${searchKeyword}`,
            );
            if (res.ok) {
                commHeaderList = await res.json();
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
            project: "",
            job: "",
            comm_header_id: "",
            comm_header_name_kr: "",
            comm_header_name_en: "",
            format: "Fixed",
            direction: "Inbound",
            total_length: "",
            description: "",
        };
    }

    // Grid functions
    function toggleAll(event) {
        if (event.target.checked) {
            selectedIds = new Set(commHeaderList.map((item) => item.id));
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
        alert("추가 버튼 클릭");
    }

    function handleGridDelete() {
        alert("삭제 버튼 클릭: " + Array.from(selectedIds).join(", "));
    }

    async function handleGridSave() {
        if (!confirm("필드 리스트를 저장하시겠습니까?")) return;

        try {
            const res = await fetch(`${$rooturl}/commHeader/saveList`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(commHeaderList),
            });

            if (res.ok) {
                alert("리스트가 저장되었습니다.");
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
        const ws = XLSX.utils.json_to_sheet(commHeaderList);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CommHeaderList");
        XLSX.writeFile(wb, "CommHeaderList.xlsx");
    }

    function handleRowClick(item) {
        // Map grid data to form (simplified)
        currentHeader.comm_header_id = item.comm_header_id;
        currentHeader.comm_header_name_kr = item.comm_header_name;
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
                        bind:value={currentHeader.project}
                    >
                        <option value="">프로젝트 선택</option>
                        <option value="P001">Project A</option>
                    </select>
                </div>
                <div class="flex items-center">
                    <span
                        class="mr-1 text-sm font-bold text-gray-600 bg-gray-200 px-2 py-1 border border-gray-300"
                        >업무</span
                    >
                    <select
                        class="border border-gray-300 rounded px-2 py-1 text-sm"
                        bind:value={currentHeader.job}
                    >
                        <option value="">업무 선택</option>
                        <option value="J001">Job A</option>
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
                    disabled
                >
                    <option>프로젝트 선택</option>
                </select>
            </div>
            <div class="flex items-center">
                <label
                    class="w-32 font-bold bg-gray-100 py-1 px-2 border border-gray-300 block text-right"
                    >업무</label
                >
                <select
                    class="flex-1 border border-gray-300 py-1 px-2"
                    disabled
                >
                    <option>업무 선택</option>
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
                    placeholder="CommHeader 자동생성"
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
                <select class="flex-1 border border-gray-300 py-1 px-2">
                    <option>요청/응답 선택</option>
                    <option>Request</option>
                    <option>Response</option>
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
                    <option value="Fixed">Fixed</option>
                    <option value="json">json</option>
                    <option value="xml">xml</option>
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
                    <option value="Inbound">Inbound</option>
                    <option value="Outbound">Outbound</option>
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
                    <option value="comm_header_name">CommHeader명</option>
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
                            >CommHeader ID</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >CommHeader Name</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >CommHeader필드 ID</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >CommHeader필드명</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >필드명(영문)</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >필드명(한글)</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >필드타입</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >필드자리수</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >필드설명</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >세그먼트</th
                        >
                        <th class="border border-gray-300 px-2 py-1"
                            >시작위치</th
                        >
                        <th class="border border-gray-300 px-2 py-1">순서</th>
                        <th class="border border-gray-300 px-2 py-1"
                            >필수여부</th
                        >
                        <th class="border border-gray-300 px-2 py-1">기본값</th>
                        <th class="border border-gray-300 px-2 py-1"
                            >포맷/패턴</th
                        >
                        <th class="border border-gray-300 px-2 py-1">코드셋</th>
                        <th class="border border-gray-300 px-2 py-1"
                            >마스킹여부</th
                        >
                        <th class="border border-gray-300 px-2 py-1">비고</th>
                    </tr>
                </thead>
                <tbody class="bg-white">
                    {#each commHeaderList as item (item.id)}
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
                                    checked={selectedIds.has(item.id)}
                                    on:change={() => toggleOne(item.id)}
                                />
                            </td>
                            <td class="border border-gray-300 px-2 py-1">P01</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.project_name}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.job_group}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.target_sys}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.comm_header_id}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.comm_header_name}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.field_id}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.field_name}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.field_name_en}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.field_name_kr}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.field_type}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.field_length}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.field_desc}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.segment}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.start_pos}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.seq}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.mandatory}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.default}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.format}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.codeset}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.masking}</td
                            >
                            <td class="border border-gray-300 px-2 py-1"
                                >{item.note}</td
                            >
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
    </div>
</div>
