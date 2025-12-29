<script>
    import { onMount } from "svelte";
    import { rooturl } from "../aqtstore";
    import * as XLSX from "xlsx";

    let dataList = [];

    // Filter Data
    let filters = {
        project: "",
        job: "",
        comm_header: "",
    };

    let searchKeyword = "";
    let selectedIds = new Set();

    // Dynamic Columns Mock
    let dynamicColumns = Array.from({ length: 15 }, (_, i) => `필드${i + 1}`);

    onMount(() => {
        // Mock Data
        dataList = [
            {
                id: "D001",
                project_name: "Project A",
                job_group: "Job A",
                target_sys: "Sys 1",
                comm_header_id: "CH001",
                comm_header_name: "Header 1",
                fields: ["Val1", "Val2", "Val3", "", "", "", "", "", "", ""],
            },
            {
                id: "D002",
                project_name: "Project A",
                job_group: "Job A",
                target_sys: "Sys 1",
                comm_header_id: "CH001",
                comm_header_name: "Header 1",
                fields: ["ValA", "ValB", "ValC", "", "", "", "", "", "", ""],
            },
        ];
    });

    async function handleSearch() {
        try {
            const query = new URLSearchParams(filters).toString();
            const res = await fetch(`${$rooturl}/commHeaderData/list?${query}`);
            if (res.ok) {
                dataList = await res.json();
            } else {
                console.error("Failed to fetch data list");
            }
        } catch (error) {
            console.error(error);
        }
    }

    function handleAdd() {
        alert("추가 버튼 클릭");
    }

    function handleDelete() {
        alert("삭제 버튼 클릭: " + Array.from(selectedIds).join(", "));
    }

    async function handleSave() {
        if (!confirm("데이터를 저장하시겠습니까?")) return;

        try {
            const res = await fetch(`${$rooturl}/commHeaderData/saveList`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataList),
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

    function handleExcelDownload() {
        // Flatten fields array for Excel export
        const exportData = dataList.map((item) => {
            const flattened = { ...item };
            // Use column names if dynamicColumns logic is robust, or just Field1..N
            // Assuming default fields array
            if (item.fields) {
                item.fields.forEach((val, idx) => {
                    flattened[`Field${idx + 1}`] = val;
                });
                delete flattened.fields;
            }
            return flattened;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CommHeaderData");
        XLSX.writeFile(wb, "CommHeaderData.xlsx");
    }

    function toggleAll(event) {
        if (event.target.checked) {
            selectedIds = new Set(dataList.map((item) => item.id));
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
</script>

<div
    class="container mx-auto p-4 lg:p-8 bg-gray-50 flex flex-col h-[calc(100vh-4.1rem)] bg-gray-50 p-4 lg:p-8 gap-4"
>
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-gray-800">CommHeader 자료등록</h2>
    </div>

    <!-- Top Filter Section -->
    <div class="bg-white shadow border border-gray-300 p-4 mb-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center space-x-4 flex-wrap gap-y-2">
                <div class="flex items-center">
                    <span
                        class="w-24 font-bold bg-gray-200 px-2 py-1 border border-gray-300 text-center text-sm"
                        >프로젝트</span
                    >
                    <select
                        class="border border-gray-300 px-2 py-1 text-sm w-40"
                        bind:value={filters.project}
                    >
                        <option value="">프로젝트 선택</option>
                        <option value="P001">Project A</option>
                    </select>
                </div>
                <div class="flex items-center">
                    <span
                        class="w-24 font-bold bg-gray-200 px-2 py-1 border border-gray-300 text-center text-sm"
                        >업무</span
                    >
                    <select
                        class="border border-gray-300 px-2 py-1 text-sm w-40"
                        bind:value={filters.job}
                    >
                        <option value="">업무 선택</option>
                        <option value="J001">Job A</option>
                    </select>
                </div>
                <div class="flex items-center">
                    <span
                        class="w-24 font-bold bg-gray-200 px-2 py-1 border border-gray-300 text-center text-sm"
                        >CommHeader</span
                    >
                    <select
                        class="border border-gray-300 px-2 py-1 text-sm w-40"
                        bind:value={filters.comm_header}
                    >
                        <option value="">CommHeader 선택</option>
                        <option value="CH001">Header 1</option>
                    </select>
                </div>
            </div>

            <div class="flex space-x-2">
                <button
                    on:click={handleSearch}
                    class="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-4 py-1 text-sm rounded transition"
                    >조회</button
                >
                <button
                    on:click={handleAdd}
                    class="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-4 py-1 text-sm rounded transition"
                    >추가</button
                >
                <button
                    on:click={handleDelete}
                    class="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-4 py-1 text-sm rounded transition"
                    >삭제</button
                >
                <button
                    on:click={handleSave}
                    class="bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 px-4 py-1 text-sm rounded transition"
                    >저장</button
                >
            </div>
        </div>
    </div>

    <!-- Middle Controls (Excel) -->
    <div class="flex justify-end mb-2 space-x-2">
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

    <!-- Grid Table -->
    <div class="bg-white p-4 shadow border border-gray-300 overflow-hidden">
        <div class="overflow-x-auto">
            <table
                class="min-w-full border-collapse border border-gray-300 text-xs text-center whitespace-nowrap"
            >
                <thead class="bg-gray-100 text-gray-700 font-semibold">
                    <tr>
                        <th
                            class="border border-gray-300 px-2 py-1 w-8 bg-gray-200"
                            ><input type="checkbox" on:change={toggleAll} /></th
                        >
                        <th class="border border-gray-300 px-2 py-1 bg-gray-200"
                            >프로젝트 ID</th
                        >
                        <th class="border border-gray-300 px-2 py-1 bg-gray-200"
                            >프로젝트명</th
                        >
                        <th class="border border-gray-300 px-2 py-1 bg-gray-200"
                            >업무그룹 ID</th
                        >
                        <th class="border border-gray-300 px-2 py-1 bg-gray-200"
                            >c_target_sys_c (업무명)</th
                        >
                        <th class="border border-gray-300 px-2 py-1 bg-gray-200"
                            >CommHeader ID</th
                        >
                        <th class="border border-gray-300 px-2 py-1 bg-gray-200"
                            >CommHeader Name</th
                        >
                        {#each dynamicColumns as col}
                            <th
                                class="border border-gray-300 px-2 py-1 bg-gray-200"
                                style="min-width: 60px;">{col}</th
                            >
                        {/each}
                    </tr>
                </thead>
                <tbody class="bg-white">
                    {#each dataList as item (item.id)}
                        <tr class="hover:bg-blue-50">
                            <td class="border border-gray-300 px-2 py-1">
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
                            {#each dynamicColumns as col, i}
                                <td
                                    class="border border-gray-300 px-2 py-1"
                                    contenteditable="true"
                                    >{item.fields[i] || ""}</td
                                >
                            {/each}
                        </tr>
                    {/each}
                    {#if dataList.length === 0}
                        <tr
                            ><td
                                colspan={7 + dynamicColumns.length}
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
