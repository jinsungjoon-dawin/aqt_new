<script>
    import { onMount } from "svelte";
    import { rooturl } from "../aqtstore";

    let allItems = [
        {
            id: 1,
            company_id: "1",
            job_name: "기업은행 전문1",
            field_name: "msg_len",
            field_length: "1",
            field_description: "메시지",
        },
        {
            id: 2,
            company_id: "1",
            job_name: "기업은행 전문1",
            field_name: "glob_id",
            field_length: "32",
            field_description: "글로벌 id",
        },
        {
            id: 3,
            company_id: "1",
            job_name: "기업은행 전문1",
            field_name: "recv_svc_c",
            field_length: "8",
            field_description: "수신 서비스 코드",
        },
        {
            id: 4,
            company_id: "1",
            job_name: "기업은행 전문1",
            field_name: "rst_recv_svc_c",
            field_length: "8",
            field_description: "수신 응답 서비스 코드",
        },
        {
            id: 5,
            company_id: "1",
            job_name: "기업은행 전문1",
            field_name: "rqst_resp_g",
            field_length: "1",
            field_description: "요청응답 구분",
        },
        {
            id: 11,
            company_id: "2",
            job_name: "국민은행 전문1",
            field_name: "kb_msg_len",
            field_length: "4",
            field_description: "KB 메시지 길이",
        },
    ];

    let items = [...allItems];
    let isLoading = false;

    let errorMessage = "";

    let selectedCompany = "";
    let searchKeyword = "";
    let selectedIds = new Set();

    function toggleAll(event) {
        if (event.target.checked) {
            selectedIds = new Set(items.map((c) => c.id));
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

    async function deleteSelected() {
        if (selectedIds.size === 0) {
            alert("삭제할 항목을 선택해주세요.");
            return;
        }
        if (
            !confirm(
                "선택한 " + selectedIds.size + "개 항목을 삭제하시겠습니까?",
            )
        )
            return;

        // Mock Delete
        allItems = allItems.filter((item) => !selectedIds.has(item.id));
        fetchItems(); // Refresh view
        selectedIds = new Set();
    }

    async function fetchItems() {
        // Client-side filtering simulation
        items = allItems.filter((item) => {
            const matchCompany =
                selectedCompany === "" || item.company_id === selectedCompany;
            const matchKeyword =
                searchKeyword === "" || item.job_name.includes(searchKeyword);
            return matchCompany && matchKeyword;
        });
    }

    function addRow() {
        const newItem = {
            id: "NEW_" + Date.now(),
            company_id: selectedCompany || "1", // Default to filtered company or 1
            job_name: "",
            field_name: "",
            field_length: "",
            field_description: "",
            isNew: true,
        };
        allItems = [newItem, ...allItems];
        fetchItems();
        selectedIds = new Set([newItem.id]);
    }

    function removeNewRow(id) {
        allItems = allItems.filter((c) => c.id !== id);
        fetchItems();
        selectedIds.delete(id);
        selectedIds = selectedIds;
    }

    async function handleSave() {
        if (selectedIds.size !== 1) {
            alert("저장할 항목을 하나만 선택해주세요.");
            return;
        }
        const id = Array.from(selectedIds)[0];
        const item = items.find((c) => c.id === id);

        if (!item) return;

        if (!item.field_name.trim()) {
            alert("필드명을 입력해주세요.");
            return;
        }

        // Mock Save
        if (item.isNew) {
            alert("저장되었습니다 (Mock): " + item.field_name);
            delete item.isNew;
            // replace temp id?
        } else {
            alert("수정되었습니다 (Mock): " + item.field_name);
        }
        selectedIds = new Set();
    }

    onMount(() => {
        fetchItems();
    });
</script>

<div class="container mx-auto p-4 lg:p-8 bg-gray-50 min-h-screen">
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl lg:text-3xl font-bold text-gray-700">업무 관리</h2>
        <div class="space-x-2 flex items-center">
            <select
                bind:value={selectedCompany}
                class="border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
            >
                <option value="">전체</option>
                <option value="1">기업은행</option>
                <option value="2">국민은행</option>
            </select>
            <input
                type="text"
                bind:value={searchKeyword}
                placeholder="업무명 입력"
                class="border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                on:keydown={(e) => e.key === "Enter" && fetchItems()}
            />
            <button
                on:click={fetchItems}
                class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white px-3 py-1 text-sm rounded-sm border border-blue-500 hover:border-transparent transition"
            >
                조회
            </button>
            <button
                on:click={addRow}
                class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white px-3 py-1 text-sm rounded-sm border border-blue-500 hover:border-transparent transition"
            >
                추가
            </button>
            <button
                on:click={deleteSelected}
                class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white px-3 py-1 text-sm rounded-sm border border-blue-500 hover:border-transparent transition"
            >
                삭제
            </button>
            <button
                on:click={handleSave}
                class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white px-3 py-1 text-sm rounded-sm border border-blue-500 hover:border-transparent transition"
            >
                저장
            </button>
        </div>
    </div>

    {#if errorMessage}
        <div
            class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
            role="alert"
        >
            <p>{errorMessage}</p>
        </div>
    {/if}

    <div class="bg-white shadow overflow-hidden border border-gray-300 mt-4">
        <table
            class="min-w-full border-collapse border border-gray-300 table-fixed text-sm"
        >
            <thead class="bg-gray-50 text-gray-700">
                <tr>
                    <th class="w-10 border border-gray-300 p-0 text-center">
                        <input
                            type="checkbox"
                            on:change={toggleAll}
                            checked={items.length > 0 &&
                                selectedIds.size === items.length}
                            class="align-middle mt-1"
                        />
                    </th>
                    <th
                        class="w-1/6 border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                    >
                        업무명
                    </th>
                    <th
                        class="w-1/4 border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                    >
                        필드명
                    </th>
                    <th
                        class="w-1/6 border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                    >
                        필드 자리수
                    </th>
                    <th
                        class="border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                    >
                        필드 설명
                    </th>
                </tr>
            </thead>
            <tbody class="bg-white">
                {#each items as item, index (item.id)}
                    <tr
                        class="hover:bg-gray-50 {selectedIds.has(item.id)
                            ? 'bg-blue-50'
                            : ''}"
                        on:click={() => toggleOne(item.id)}
                    >
                        <td
                            class="border border-gray-300 p-0 text-center bg-gray-50"
                            on:click|stopPropagation
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.has(item.id)}
                                on:change={() => toggleOne(item.id)}
                                class="align-middle mt-1"
                            />
                        </td>
                        <td
                            class="border border-gray-300 px-2 py-1 outline-none focus:ring-2 focus:ring-green-500 focus:z-10 relative cursor-text text-gray-900"
                            contenteditable="true"
                            bind:textContent={item.job_name}
                            on:click|stopPropagation
                        >
                        </td>
                        <td
                            class="border border-gray-300 px-2 py-1 outline-none focus:ring-2 focus:ring-green-500 focus:z-10 relative cursor-text text-gray-900"
                            contenteditable="true"
                            bind:textContent={item.field_name}
                            on:click|stopPropagation
                        >
                        </td>
                        <td
                            class="border border-gray-300 px-2 py-1 outline-none focus:ring-2 focus:ring-green-500 focus:z-10 relative cursor-text text-gray-900 text-center"
                            contenteditable="true"
                            bind:textContent={item.field_length}
                            on:click|stopPropagation
                        >
                        </td>
                        <td
                            class="border border-gray-300 px-2 py-1 outline-none focus:ring-2 focus:ring-green-500 focus:z-10 relative cursor-text text-gray-900"
                            contenteditable="true"
                            bind:textContent={item.field_description}
                            on:click|stopPropagation
                        >
                        </td>
                    </tr>
                {/each}
                {#if items.length === 0 && !isLoading}
                    <tr>
                        <td
                            class="border border-gray-300 px-2 py-1 h-8 text-center"
                            colspan="5">해당 데이터가 없습니다.</td
                        >
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>
</div>

<style>
    /* Optional: Simple fade-in animation for modal */
    @keyframes fade-in-down {
        0% {
            opacity: 0;
            transform: translateY(-10px);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .animate-fade-in-down {
        animation: fade-in-down 0.3s ease-out;
    }
</style>
