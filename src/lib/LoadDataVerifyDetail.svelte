<script lang="ts">
  import { onMount } from "svelte";
  import { rooturl, t } from "../aqtstore";
  import * as XLSX from 'xlsx';
  import LoadDataVerifyResult from "./LoadDataVerifyResult.svelte";
  export let selData;
  export let selectedRow;
  let selected = true;
  let leftDates = [];
  let tableHeader  = $t.loadDataDetail.tableHeader;
  let list = [];
  let currentPage = 1;
  let itemsPerPage = 10;
  //차수, ASIS 일자, TOBE 일자 조회
  async function getLeftData() {
    const res = await fetch($rooturl + "/loaddataverifyresult");
    if (res.ok){
      return await res.json();
    }else
      throw new Error(res.statusText);
  }

  async function getDetail() {
    const res = await fetch($rooturl + "/loaddataverifyresult/loaddata_checkreslist?did=" + selData.did);
    if (res.ok){
      list = await res.json();
      return list;
    }
    else
      throw new Error(res.statusText);
  }
  onMount(async () => {
    leftDates = await getLeftData();
    list = await getDetail();
  });
  
  $: paginatedList = list.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  
  $: totalPages = Math.ceil(list.length / itemsPerPage);

  function popClose(){
    showModal = false;
   }
  
  function goToPage(page) {
      if (page > 0 && page <= totalPages) {
          currentPage = page;
      }
  }

  function formatNumber(value) {
    return value != null && typeof value === "number" ? value.toLocaleString() : "0";
  }
  function parseNewlines(str) {
    return str.replace(/\n/g, "<br>");
  }
  function getSum(column) {
    return list.reduce((sum, item) => sum + item[column], 0);
  }
  const handleRowClick = (idx) => {
    selectedRow = idx; // 현재 클릭된 row의 seq를 기준으로 선택 상태 설정
    selData = leftDates[idx];
  }
  function excelDown(){
    // 🔹 헤더 추가
    let header = $t.loadDataDetail.tableHeader;
    
    // 🔹 JSON 데이터를 배열로 변환 (첫 줄은 헤더)
    let worksheetData = [header, ...list.map(obj => [obj.sqlno, obj.sqlnm, 
                          formatNumber(obj.sumasis), formatNumber(obj.sumtobe),
                          formatNumber((obj.sumasis - obj.sumtobe)) 
                        ])];

    // 🔹 워크시트 생성
    let ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // 🔹 워크북 생성 및 워크시트 추가
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // 🔹 엑셀 파일 생성 및 다운로드
    XLSX.writeFile(wb, selData.dname+ " " + $t.loadDataDetail.dataCheckDiff +".xlsx");
  }
</script>
{#if selected}
<div class="mx-auto p-3 w-10/12 h-5/6">
  <div class="flex justify-between">
    <div class="w-3/12 bg-gray-700 rounded-lg flex-wrap p-3" >
      <div class="flex mb-3 border  rounded border-zinc-600 text-zinc-100 bg-lime-600 s-d-sQQ5iFljvb">
        <label class="px-3 w-full py-2  border-r border-l bg-lime-600 border-zinc-600  s-d-sQQ5iFljvb">{$t.loadData.leftMainTitle}</label>
      </div>
      <div class="flex  border   rounded border-zinc-600 text-zinc-100 ">
        <label class="px-3 w-2/5 py-2  border-r border-l  border-zinc-600 ">{$t.loadData.leftTitle}</label>
        <label class="px-3 w-3/5 py-2  border-r border-l  border-zinc-600 ">{$t.loadData.leftDate1}</label>
      </div>
      {#if leftDates.length !== 0}
        {#each leftDates as item, idx}
            <div class="flex mb-3 border  rounded border-zinc-600 text-zinc-100 " on:click={() => {handleRowClick(idx); getDetail(); }}>
              <label class="px-3 w-2/5 py-2  border-r border-l bg-zinc-700 border-zinc-600 {selectedRow === idx ? 'text-yellow-100' : ''}">{item.dname}</label>
              <input type="text" class="w-3/5 pl-3  border-r  bg-zinc-700 border-zinc-600 {selectedRow === idx ? 'text-yellow-100' : ''}" value="{item.wdate}" readonly>
          </div>
        {/each}
      {/if}
    </div>
      
    <div class="flex flex-wrap flex-row items-center mx-2 w-9/12">
      <div class="flex-col bg-gray-700 rounded-lg w-full" >
        <div class="flex w-full  border-b-2 border-gray-500 items-center">
            <h1 class="text-2xl w-3/5 tracking-tight text-yellow-100 p-3">{selData.dname} {$t.loadData.mainTopTitle}</h1>
            <h1 class="text-1xl w-2/5 text-end tracking-tight text-yellow-100 p-3">{$t.loadData.leftDate1}: {selData.wdate}</h1>
        </div>
        
        <div class="w-full overflow-auto bg-gray-700 p-3 rounded-lg">
          <div class="w-full border-gray-500  py-3 text-end">
              <button class="bg-gray-500 hover:bg-sky-500 text-yellow-100 py-2 px-4 rounded focus:outline-none focus:shadow-outline"  on:click={() => excelDown()}>{$t.com.btn.excelDown}</button>
              <button class="bg-gray-500 hover:bg-sky-500 text-yellow-100 py-2 px-4 rounded focus:outline-none focus:shadow-outline"  on:click={() => { selected = false; }}>{$t.com.btn.prePage}</button>
          </div>
        <table class="w-full text-md text-nowrap bg-gray-800 text-white  shadow-md rounded mb-4">
        <thead>
          <tr class="">
            {#each tableHeader as item, idx}
            <th class="text-center bg-zinc-600 border border-zinc-700 p-3 px-5">{item}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#if paginatedList.length > 0}
              {#each paginatedList as item, index}
                 <tr class="border-b hover:bg-sky-500">
                      <td class="text-center  border border-zinc-700 p-3 px-5">{item.sqlno}</td>
                      <td class="text-center  border border-zinc-700 p-3 px-5"> {item.sqlnm} </td>
                      <td class="text-right  border border-zinc-700 p-3 px-5"> {formatNumber(item.sumasis)} </td>
                      <td class="text-right  border border-zinc-700 p-3 px-5"> {formatNumber(item.sumtobe)} </td>
                      <td class="text-right  border border-zinc-700 p-3 px-5"> {formatNumber((item.sumasis - item.sumtobe))} </td>
                  </tr>
              {/each}
              <tr>
                <td class="text-center bg-zinc-600 border border-zinc-700   p-3 px-5" colspan="2">{$t.loadDataDetail.totCnt}</td>
                <td class="text-right bg-zinc-600 border border-zinc-700   p-3 px-5">{formatNumber(getSum("sumasis"))}</td>
                <td class="text-right bg-zinc-600 border border-zinc-700   p-3 px-5">{formatNumber(getSum("sumtobe"))}</td>
                <td class="text-right bg-zinc-600 border border-zinc-700   p-3 px-5">{formatNumber(getSum("sumasis") - getSum("sumtobe"))}</td>
              </tr>
              
              
          {:else}
              <tr>
                  <td colspan="7" class="text-center  border border-zinc-700 p-3 px-5">{$t.com.paging.noData}</td>
              </tr>
              <tr>
                <td class="text-center bg-zinc-600 border border-zinc-700   p-3 px-5" colspan="2">{$t.loadData.totCnt}</td>
              </tr>
          {/if}
      </tbody>
      </table>
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
</div>
{:else}
<LoadDataVerifyResult></LoadDataVerifyResult>
{/if}