<script lang="ts">
    import { rooturl, t } from "../aqtstore";
    import * as XLSX from "xlsx";
    import { onMount } from "svelte";

    let selectedRow = 0;
    let fileInput; // 파일 input 요소 참조
    let gubun;
    let searchtxt="";
    let currentPage = 1;
    let itemsPerPage = 10;
    // let list = [
    //     {flag:"", checked : false, pkey: 1, usrid:"test1", host:"172.172.0.1",usrdesc: "Davpkey McHenry",  admin: true, apps:"All", regdt:"2023-08-29"},
    //     {flag:"", checked : false, pkey: 2, usrid:"test2", host:"172.172.0.2",usrdesc: "Frank Kirk",  admin: false, apps:"All", regdt:"2024-08-29"},
    //     {flag:"", checked : false, pkey: 3, usrid:"test3", host:"172.172.0.3",usrdesc: "Rafael Morales",  admin: false, apps:"All", regdt:"2024-01-29"},
    //     {flag:"", checked : false, pkey: 4, usrid:"test4", host:"172.172.0.4",usrdesc: "Minnie Walter",  admin: true, apps:"All", regdt:"2025-01-22"},
    //     {flag:"", checked : false, pkey: 5, usrid:"test5", host:"172.172.0.5",usrdesc: "John Doe",  admin: true, apps:"All", regdt:"2023-08-29"},
    //     {flag:"", checked : false, pkey: 6, usrid:"test6", host:"172.172.0.6",usrdesc: "Jane Smith",  admin: false, apps:"All", regdt:"2024-12-29"},
    //     {flag:"", checked : false, pkey: 7, usrid:"test7", host:"172.172.0.7",usrdesc: "Alice Johnson",  admin: true, apps:"All", regdt:"2024-09-29"},
    //     {flag:"", checked : false, pkey: 8, usrid:"test8", host:"172.172.0.8",usrdesc: "Bob Brown",  admin: true, apps:"All", regdt:"2023-08-29" },
    //     {flag:"", checked : false, pkey: 9, usrid:"test9", host:"172.172.0.9",usrdesc: "Charlie White",  admin: true, apps:"All", regdt:"2023-08-29" },
    //     {flag:"", checked : false, pkey: 10, usrid:"test10", host:"172.172.0.10",usrdesc: "Eve Black",  admin: false, apps:"All", regdt:"2023-08-29" },
    //     {flag:"", checked : false, pkey: 11, usrid:"test11", host:"172.172.0.11",usrdesc: "Davpkey McHenry1",  admin: true, apps:"All", regdt:"2023-08-29" },
    //     {flag:"", checked : false, pkey: 12, usrid:"test12", host:"172.172.0.12",usrdesc: "Davpkey McHenry2",  admin: false, apps:"All", regdt:"2023-08-29" },
    //     ];
    let list = [];
    function triggerFileUpload() {
        fileInput.click(); // 버튼 클릭 시 input 클릭 이벤트 발생
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const headers = jsonData[0];
            const rows = jsonData.slice(1).map(row => {
                let obj = {};
                headers.forEach((key, i) => {
                    obj[key] = row[i] || "";
                });
                const merged = {};
                const cols = {checked : true, pkey: 0, usrid: "id", host:"Host",usrdesc: $t.user.usrdesc,  admin: false, apps:"", regdt:"", flag:"new",password:""};
                // 모든 키 가져오기
                const keys = new Set([...Object.keys(obj), ...Object.keys(cols)]);
                // 각 키별로 병합
                keys.forEach(key => {
                    merged[key] = obj[key] || cols[key];
                    if(key == "admin") merged[key] = ((merged[key] == "0" || merged[key] == 0 ) ? false : true); 
                });
                return merged;
            });

            // 반응성을 유지하며 업데이트
            rows.reverse();
            rows.forEach((item) => {
                list = [item, ...list];
            });
        
        };
         reader.readAsArrayBuffer(file);
    }


    const handleRowClick = (idx) => {
        selectedRow = idx; // 현재 클릭된 row의 seq를 기준으로 선택 상태 설정
        currentPage = 1;
    };
    $: paginatedlist =  list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    $: totalPages = Math.ceil(list.length / itemsPerPage);

    let selectAll = false;

    // 전체 선택 토글 함수
    function toggleAll() {
        list = list.map(item => ({ ...item, checked: selectAll }));
    }

    // 개별 체크박스 변경 감지
    function updateSelection() {
        selectAll = list.every(item => item.checked);
    }
    function goToPage(page) {
        if (page > 0 && page <= totalPages) {
            currentPage = page;
        }
    }
    
    //사용자 추가
    function addUser() {
        list = [{checked : true, pkey: 0, usrid: "id", host:"Host",usrdesc: $t.user.usrdesc,  admin: false, apps:"", regdt: "", flag:"new",password:""}, ...list]; // 새로운 배열로 업데이트 (반응성 유지)
    }
   
    
    function checkData(){
        const saveList = list.filter((item, idx) => item.checked);
        if(saveList.length == 0){
            alert($t.user.checkData);
            return false;
        }
        return true;
    }
    
    //사용자 조회
    async function searchUser() {
        let serviceUrl = $rooturl + "/useruploadmanagement/user_list?gubun=" + gubun + "&searchtxt=" + searchtxt;
        const res = await fetch(serviceUrl);
        if (res.ok){
        list = await res.json();
        }else
        throw new Error(res.statusText);
    }
    
    //사용자 삭제
    function deleteUser(){
        if(!checkData())return;
        if(!confirm($t.user.deleteConfirm))return;
        const saveList = list.filter((item, idx) => item.checked);
        let serviceUrl = $rooturl + "/useruploadmanagement/user_del";
        fetch(serviceUrl, {
            // method: "DELETE" ,
            method: "DELETE" ,
            headers: {
                "Content-Type": "application/json",
            },
            // body:  JSON.stringify({saveList}),
                body:  JSON.stringify(saveList)
            })
            .then(async (res) => {
                let rmsg = await res.json();
                if (res.status == 200 && rmsg.rdata===1) {
                    alert($t.user.deleteSuccess);
                    searchUser();
                }
            })
            .catch((err) => {
                alert("error:" + err.message);
            });
    }
    //사용자 저장
    function saveUser(){
        if(!checkData())return;
        if(!confirm($t.user.saveConfirm))return;
        if(!validationCheck())return;
        const saveList = list.filter((item, idx) => item.checked);
        let serviceUrl = $rooturl + "/useruploadmanagement/user_save";
        fetch(serviceUrl, {
            method: "POST" ,
            headers: {
                "Content-Type": "application/json",
            },
            // body:  JSON.stringify({saveList}),
                body:  JSON.stringify(saveList)
            })
            .then(async (res) => {
                let rmsg = await res.json();
                if (res.status == 200 && rmsg.rdata===1) {
                    alert($t.user.saveSuccess);
                    searchUser();
                }
            })
            .catch((err) => {
                alert("error:" + err.message);
            });
    }
    let errors = {}; // 에러 상태 저장
    function validationCheck(){
        errors = {};
        for (var i = 0; i < rlist.length; i++) {
            if(list[i].checked === true){
                if(list[i].usrid === ""){
                    errors[i] = { ...errors[i], usrid: $t.user.usrId + $t.user.check }; 
                    alert($t.user.usrId + $t.user.check);
                    return false;
                }
                else if(list[i].host === ""){
                    errors[i] = { ...errors[i], host: $t.user.host + $t.user.check };  
                    alert($t.user.host + $t.user.check);
                    return false;
                }
                else if(list[i].usrdesc === ""){
                    errors[i] = { ...errors[i], usrdesc: $t.user.usrdesc + $t.user.check }; 
                    alert($t.user.usrdesc + $t.user.check);
                    return false;
                }
            }
        }
        return true;
    }
    

    
    $: rlist = list;
    $:{
        console.log(JSON.stringify(rlist));
    }
    onMount(async () => {
        searchUser();
    });
</script>
<style>
    .error {
        /* border: 3px solid #ff2056; */
        background-color: #ff205675;
    }
</style>
<div class="mx-auto p-3 w-10/12 h-5/6">
    <div class="flex justify-between">
        <div class="flex-col bg-gray-700 rounded-lg w-full" >
          <div class="flex w-full  border-b-2 border-gray-500 items-center">
              <h1 class="text-2xl w-3/5 tracking-tight text-yellow-100 p-3"> {$t.user.pageNm}</h1>
          </div>
          
          <div class="w-full overflow-auto bg-gray-700 p-3 rounded-lg">
            <div class="w-full">
                <div class="w-full overflow-auto bg-gray-200 p-3 mb-3 rounded-lg">
                    <div class="flex justify-center ">
                        <select on:change={currentPage = 1} bind:value={gubun}  class="w-2/12 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 pl-4 border border-gray-400 rounded-l shadow">
                            {#each $t.user.selectData as item}
                            <option value={item.key}>{item.value}</option>
                            {/each}
                        </select>
                        <input type="text" bind:value={searchtxt} class="w-4/12 pl-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 pl-4 border-y border-gray-400  shadow" >
                        <button class="bg-white hover:bg-gray-100 text-gray-800 font-semibold mr-2 py-2 px-4 border border-gray-400 rounded-r shadow"  on:click={() => searchUser()}>{$t.com.btn.search}</button>
                        <button class="bg-white hover:bg-gray-100 text-gray-800 font-semibold mx-2 py-2 px-4 border border-gray-400 rounded shadow"  on:click={()=> addUser()}>{$t.com.btn.userAdd}</button>
                        <button class="bg-white hover:bg-gray-100 text-gray-800 font-semibold mx-2 py-2 px-4 border border-gray-400 rounded shadow"  on:click={()=> deleteUser()}>{$t.com.btn.delete}</button>
                        <button class="bg-white hover:bg-gray-100 text-gray-800 font-semibold mx-2 py-2 px-4 border border-gray-400 rounded shadow"  on:click={() => saveUser()}>{$t.com.btn.save}</button>
                        <!-- 숨겨진 파일 업로드 input -->
                        <input type="file" bind:this={fileInput} accept=".xlsx, .xls" on:change={handleFileUpload} style="display: none;" />
                        <!-- 파일 업로드 버튼 -->
                        <button class="bg-white hover:bg-gray-100 text-gray-800 font-semibold mx-2 py-2 px-4 border border-gray-400 rounded shadow"  on:click={triggerFileUpload}>{$t.com.btn.excelUpload}</button>
                    </div>
                    
                </div>    
            </div>
          <table class="w-full text-md text-nowrap bg-gray-800 text-white  shadow-md rounded mb-4">
          <thead>
            <tr>
                {#each $t.user.tableHeader as item}
                    <th class="text-center p-3 px-10 border border-zinc-700 bg-zinc-600">
                    {#if item === " "}
                        <input type="checkbox" class="border-gray-300 rounded h-4 w-4" bind:checked={selectAll} on:change={toggleAll} />
                    {:else}
                        {item}
                    {/if}
                    </th>
                {/each}
            </tr>
            
          </thead>
          <tbody>
            {#if paginatedlist.length > 0}
            {#each paginatedlist as item, idx}
                  <tr class="border-b hover:bg-gray-700 focus:bg-gray-700 {selectedRow === idx ? 'bg-gray-700' : ''}" on:click={() => (selectedRow = idx)}>
                    <td class="text-center p-3 px-5 border border-zinc-600">
                        <input type="checkbox" class="border-gray-300 rounded h-4 w-4" bind:checked={item.checked}/>
                    </td>
                    {#if item.flag === "new"}
                        <td class="p-3 px-5 border border-zinc-600" bind:textContent={item.usrid} contenteditable="true"  class:error={errors[idx]?.usrid} />
                    {:else}
                        <td class="p-3 px-5 border border-zinc-600" bind:textContent={item.usrid} contenteditable="false"  />
                    {/if}
                    <td class="p-3 px-5  border border-zinc-600" bind:textContent={item.host} contenteditable="true"  class:error={errors[idx]?.host} />
                    <!-- <td class="p-3 px-5 border border-zinc-600"  bind:textContent={item.host} contenteditable="true"  class:error={errors[idx]?.host}  /> -->
                    <td class="p-3 px-5  border border-zinc-600" bind:textContent={item.usrdesc} contenteditable="true" class:error={errors[idx]?.usrdesc}/>
                    <td class="p-3 px-5  border border-zinc-600 text-center"><input type="checkbox" bind:checked={item.admin} class="border-gray-300 rounded h-4 w-4"/></td>
                    <td class="p-3 px-5  border border-zinc-600 text-center"  bind:textContent={item.apps} contenteditable="true"/>
                    <td class="p-3 px-5  border border-zinc-600 text-center" bind:textContent={item.regdt} contenteditable="false"/>
                </tr>
            {/each}
        {:else}
            <tr>
                <td colspan="7" class="p-3 px-5 p-3 px-5 text-center text-yellow-100">{$t.com.paging.noData}</td>
            </tr>
        {/if}
          </tbody>
        </table>
        <!-- <p>선택된 항목: {list.filter(item => item.checked).map(item => item.usrdesc).join(", ")}</p> -->
      </div>
      <div class="flex w-full justify-center mb-4">
        <button class="px-3 py-1 bg-gray-500 text-yellow-100 rounded mx-1 hover:bg-gray-700" on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
          {$t.com.paging.previous}
        </button>
        {#each Array(totalPages).fill() as _, pageIndex}
            <button class="px-3 py-1 bg-gray-300 text-black rounded mx-1 hover:bg-gray-500" class:bg-gray-700={pageIndex + 1 === currentPage} on:click={() => goToPage(pageIndex + 1)}>
                {pageIndex + 1}
            </button>
        {/each}
        <button class="px-3 py-1 bg-gray-500 text-yellow-100 rounded mx-1 hover:bg-gray-700" on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
          {$t.com.paging.next}
        </button>
      </div>
    </div>
  </div>
  </div>