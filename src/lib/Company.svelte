<script>
    import { onMount } from "svelte";
    import { rooturl } from "../aqtstore";

    let companies = [
        {
            id: 1,
            company_name: "기업은행",
            company_description: "기업은행 설명",
            common_item: "비고1",
        },
        {
            id: 2,
            company_name: "국민은행",
            company_description: "국민은행 설명",
            common_item: "비고2",
        },
    ];
    let isLoading = false;

    let errorMessage = "";

    let searchType = "company_name";
    let searchKeyword = "";
    let selectedIds = new Set();

    function toggleAll(event) {
        if (event.target.checked) {
            selectedIds = new Set(companies.map((c) => c.id));
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

        const idsToDelete = Array.from(selectedIds);
        const apiDeleteIds = [];
        let localDeleteCount = 0;

        idsToDelete.forEach((id) => {
            const company = companies.find((c) => c.id === id);
            if (company && company.isNew) {
                companies = companies.filter((c) => c.id !== id);
                localDeleteCount++;
            } else {
                apiDeleteIds.push(id);
            }
        });

        // Remove locally deleted from selection
        if (localDeleteCount > 0) {
            selectedIds = new Set(apiDeleteIds);
            selectedIds = selectedIds; // Reactivity
        }

        if (apiDeleteIds.length === 0) return;

        try {
            await Promise.all(
                apiDeleteIds.map((id) =>
                    fetch(`${$rooturl}/company/delete/${id}`, {
                        method: "DELETE",
                    }),
                ),
            );
            selectedIds = new Set();
            fetchCompanies();
        } catch (err) {
            alert("삭제 중 오류가 발생했습니다: " + err.message);
        }
    }

    async function fetchCompanies() {
        isLoading = true;
        try {
            const queryParams = new URLSearchParams();
            if (searchKeyword) {
                queryParams.append("searchType", searchType);
                queryParams.append("keyword", searchKeyword);
            }
            const res = await fetch(
                `${$rooturl}/company/list?${queryParams.toString()}`,
            );
            if (!res.ok) throw new Error("Failed to fetch companies");
            companies = await res.json();
        } catch (err) {
            errorMessage = err.message;
        } finally {
            isLoading = false;
        }
    }

    function addRow() {
        const newCompany = {
            id: "NEW_" + Date.now(),
            company_name: "",
            company_description: "",
            common_item: "",
            isNew: true,
        };
        companies = [newCompany, ...companies];
        selectedIds = new Set([newCompany.id]);
    }

    function removeNewRow(id) {
        companies = companies.filter((c) => c.id !== id);
        selectedIds.delete(id);
        selectedIds = selectedIds;
    }

    async function handleSave() {
        if (selectedIds.size !== 1) {
            alert("저장할 항목을 하나만 선택해주세요.");
            return;
        }
        const id = Array.from(selectedIds)[0];
        const company = companies.find((c) => c.id === id);

        if (!company) return;

        if (company.isNew) {
            // Save new row
            if (!company.company_name.trim()) {
                alert("고객사 이름을 입력해주세요.");
                return;
            }
            try {
                const res = await fetch(`${$rooturl}/company/add`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        company_name: company.company_name,
                        company_description: company.company_description,
                        common_item: company.common_item,
                    }),
                });
                const data = await res.json();
                if (!res.ok)
                    throw new Error(data.message || "Error adding company");

                // Refresh list to replace temp ID with real ID
                fetchCompanies();
            } catch (err) {
                alert(err.message);
            }
        } else {
            // Update existing row
            if (!company.company_name.trim()) {
                alert("고객사 이름을 입력해주세요.");
                return;
            }
            try {
                const res = await fetch(`${$rooturl}/company/update`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(company),
                });
                const data = await res.json();
                if (!res.ok)
                    throw new Error(data.message || "Error updating company");

                alert("수정되었습니다.");
                fetchCompanies();
            } catch (err) {
                alert(err.message);
            }
        }
    }

    async function deleteCompany(id) {
        if (!confirm("정말로 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(`${$rooturl}/company/delete/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.message || "Error deleting company");

            fetchCompanies();
        } catch (err) {
            alert(err.message);
        }
    }

    onMount(() => {
        // fetchCompanies();
    });
</script>

<div class="container mx-auto p-4 lg:p-8 bg-gray-50 min-h-screen">
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl lg:text-3xl font-bold text-gray-700">
            고객사 관리
        </h2>
        <div class="space-x-2 flex items-center">
            <select
                bind:value={searchType}
                class="border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
            >
                <option value="company_name">고객사 이름</option>
                <option value="company_description">고객사 설명</option>
            </select>
            <input
                type="text"
                bind:value={searchKeyword}
                placeholder="검색어 입력"
                class="border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                on:keydown={(e) => e.key === "Enter" && fetchCompanies()}
            />
            <button
                on:click={fetchCompanies}
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
                            checked={companies.length > 0 &&
                                selectedIds.size === companies.length}
                            class="align-middle mt-1"
                        />
                    </th>
                    <th
                        class="w-1/4 border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                    >
                        고객사 이름
                    </th>
                    <th
                        class="border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                    >
                        고객사 설명
                    </th>
                    <th
                        class="border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100 text-gray-600 select-none"
                    >
                        공통항목
                    </th>
                </tr>
            </thead>
            <tbody class="bg-white">
                {#each companies as company, index (company.id)}
                    <tr
                        class="hover:bg-gray-50 {selectedIds.has(company.id)
                            ? 'bg-blue-50'
                            : ''}"
                        on:click={() => toggleOne(company.id)}
                    >
                        <td
                            class="border border-gray-300 p-0 text-center bg-gray-50"
                            on:click|stopPropagation
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.has(company.id)}
                                on:change={() => toggleOne(company.id)}
                                class="align-middle mt-1"
                            />
                        </td>
                        <td
                            class="border border-gray-300 px-2 py-1 outline-none focus:ring-2 focus:ring-green-500 focus:z-10 relative cursor-text text-gray-900"
                            contenteditable="true"
                            bind:textContent={company.company_name}
                            on:click|stopPropagation
                        >
                        </td>
                        <td
                            class="border border-gray-300 px-2 py-1 outline-none focus:ring-2 focus:ring-green-500 focus:z-10 relative cursor-text text-gray-900"
                            contenteditable="true"
                            bind:textContent={company.company_description}
                            on:click|stopPropagation
                        >
                        </td>
                        <td
                            class="border border-gray-300 px-2 py-1 outline-none focus:ring-2 focus:ring-green-500 focus:z-10 relative cursor-text text-gray-900"
                            contenteditable="true"
                            bind:textContent={company.common_item}
                            on:click|stopPropagation
                        >
                        </td>
                    </tr>
                {/each}
                {#if companies.length === 0 && !isLoading}
                    <tr>
                        <td
                            class="border border-gray-300 px-2 py-1 h-8 text-center"
                            colspan="4">해당 데이터가 없습니다.</td
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
