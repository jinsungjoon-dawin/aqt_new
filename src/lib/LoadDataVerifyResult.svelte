<script lang="ts">
  import LoadDataVerifyDetail from "./LoadDataVerifyDetail.svelte";
  import { onMount } from "svelte";
  import { rooturl, t } from "../aqtstore";
  import * as XLSX from 'xlsx';

  let leftDates = [];
  let selData;
  let list = [];
  let chkList = [];
  let selectedRow = 0;
  let selected = true;
  let currentPage = 1;
  let itemsPerPage = 10;
  let showModal = false;
  let tableHeader  = $t.loadData.tableHeader;
  let bTableHeader = $t.loadData.bTableHeader;

  //차수, ASIS 일자, TOBE 일자 조회
  async function getLeftData() {
    const res = await fetch($rooturl + "/loaddataverifyresult");
    if (res.ok){
      return await res.json();
    }else
      throw new Error(res.statusText);
  }


  async function getData() {
    const res = await fetch($rooturl + "/loaddataverifyresult/loaddata_list?did=" + selData.did);
    if (res.ok){
      list = await res.json();
      return list;
    }
    else
      throw new Error(res.statusText);
  }
  async function getCheckData() {
    const res = await fetch($rooturl + "/loaddataverifyresult/loaddata_checkres?did=" + selData.did);
    if (res.ok){
      chkList = await res.json();
      return chkList;
    }
    else
      throw new Error(res.statusText);
  }


  const handleRowClick = (idx) => {
    selectedRow = idx; // 현재 클릭된 row의 seq를 기준으로 선택 상태 설정
    selData = leftDates[idx];
  };
// 합계 계산 함수
function getSum(column) {
    return list.reduce((sum, item) => sum + item[column], 0);
  }
  onMount(async () => {
    leftDates = await getLeftData();
    
    //[{"seq":"1차","asisdt":"2025-01-02","tobedt":"2025-01-20"}]
    if(leftDates.length > 0){
      selData = leftDates[selectedRow];
      list = await getData();
      chkList = await getCheckData();
    }
  });
  function formatNumber(value) {
    return value != null && typeof value === "number" ? value.toLocaleString() : "0";
  }
  function parseNewlines(str) {
    return str.replace(/\n/g, "<br>");
  }
  function getDetail(value){
    selected = value > 0 ? false : true;
  }
  function getModalFlag(){
    showModal = !showModal;
  }


  $: paginatedList = list.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  
  $: totalPages = Math.ceil(list.length / itemsPerPage);

  
  function goToPage(page) {
      if (page > 0 && page <= totalPages) {
          currentPage = page;
      }
  }


  function excelDown(){
    // 🔹 헤더 추가
    let header = $t.loadData.schemaExcelHeader;

    // 🔹 JSON 데이터를 배열로 변환 (첫 줄은 헤더)
    let worksheetData = [header, ...list.map(obj => [obj.dbname, obj.dbuser, 
                          formatNumber(obj.tblasis), formatNumber(obj.tbltobe), 
                          formatNumber(obj.idxasis), formatNumber(obj.idxtobe), 
                          formatNumber(obj.objasis), formatNumber(obj.objtobe), 
                          formatNumber(obj.invalidasis), formatNumber(obj.invalidasis),
                        ])];

    // 🔹 워크시트 생성
    let ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws["!cols"] = header.map(h => ({ wch: h.length + 5 })); // +5s는 여유 공간
    // 🔹 워크북 생성 및 워크시트 추가
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // 🔹 엑셀 파일 생성 및 다운로드
    XLSX.writeFile(wb, selData.dname + " " +  $t.loadData.schemaTitle+".xlsx");
  }
  
</script>


{#if selected}
<div class="mx-auto p-3 w-10/12 h-5/6">
<div class="flex justify-between">
  <div class="w-3/12 bg-gray-700 rounded-lg flex-wrap p-3" >
    <div class="flex mb-3 border  rounded border-zinc-600 text-zinc-100 bg-lime-600 ">
      
      <label class="px-3 w-full py-2  border-r border-l bg-lime-600 border-zinc-600  ">{$t.loadData.leftMainTitle}</label>
    </div>
    <div class="flex  border   rounded border-zinc-600 text-zinc-100 ">
      <label class="px-3 w-2/5 py-2  border-r border-l  border-zinc-600 ">{$t.loadData.leftTitle}</label>
      <label class="px-3 w-3/5 py-2  border-r border-l  border-zinc-600 ">{$t.loadData.leftDate1}</label>
    </div>
    {#if leftDates.length !== 0}
      {#each leftDates as item, idx}
          <div class="flex mb-3 border  rounded border-zinc-600 text-zinc-100 " on:click={() => {handleRowClick(idx); getData(); getCheckData();}}>
            <label class="px-3 w-2/5 py-2  border-r border-l bg-zinc-700 border-zinc-600 {selectedRow === idx ? 'text-yellow-100' : ''}">{item.dname}</label>
            <input type="text" class="w-3/5 pl-3  border-r  bg-zinc-700 border-zinc-600 {selectedRow === idx ? 'text-yellow-100' : ''}" value="{item.wdate}" readonly>
        </div>
      {/each}
    {/if}
  </div>
    
  <div class="flex flex-wrap flex-row items-center mx-2 w-9/12">
    {#if leftDates.length !== 0}
        <div class="flex-col bg-gray-700 rounded-lg w-full" >
          <div class="flex w-full  border-b-2 border-gray-500 items-center">
              <h1 class="text-2xl w-3/5 tracking-tight text-yellow-100 p-3">{selData.dname} {$t.loadData.mainTopTitle}</h1>
              <h1 class="text-1xl w-2/5 text-end tracking-tight text-yellow-100 p-3">{$t.loadData.leftDate1}: {selData.wdate}</h1>
          </div>
            <!-- 상단 -->
            <div class="flex flex-wrap w-full p-3 justify-center">
              <div class="w-full overflow-auto bg-gray-800 p-3 rounded-lg">
                <div class="w-full border-gray-500  py-3 text-end">
                  <button class="bg-gray-500 hover:bg-sky-500 text-yellow-100 py-2 px-4 rounded focus:outline-none focus:shadow-outline"  on:click={() => excelDown()}>{$t.com.btn.excelDown}</button>
                </div>
                <table class="w-full text-md text-nowrap bg-gray-800 text-white  shadow-md rounded mb-4">
                  <thead>
                    <tr class="">
                      <th class="text-center border border-zinc-700  bg-zinc-600 order p-3 px-5" colspan="10">{$t.loadData.schemaTitle}</th>
                    </tr>
                      {#each tableHeader as row, rowIdx}
                        <tr class="">
                          {#each row as cel, celIdx}
                            {#if celIdx < row.length - 1 && row[celIdx] == row[celIdx + 1]}
                              <th class="text-center bg-zinc-600 border border-zinc-700   p-3 px-5" colspan="2">{cel}</th>
                              <!-- 다음 값이 동일하므로 현재 값 출력 후 다음 값은 건너뛰기 -->
                              {:else if celIdx > 0 && row[celIdx] == row[celIdx - 1]}
                              <!-- 이미 이전에 colspan이 적용된 경우 빈 블록으로 스킵 -->
                            {:else}
                              <!-- rowspan을 위해 다음 행과 비교 -->
                              {#if rowIdx < tableHeader.length - 1 && row[celIdx] == tableHeader[rowIdx + 1][celIdx]}
                                <th class="text-center bg-zinc-600 border border-zinc-700 p-3 px-5" rowspan="2">{cel}</th>
                              {:else if row[celIdx] == tableHeader[rowIdx -1][celIdx]}
                              {:else}
                                <th class="text-center bg-zinc-600 border border-zinc-700 p-3 px-5">{cel}</th>
                              {/if}
                            {/if}
                          {/each}
                        </tr>
                      {/each}
                    </thead>
                    <tbody>
                        {#if paginatedList.length > 0}
                            {#each paginatedList as item, index}
                            <tr class="border-b hover:bg-gray-700">
                                    <td class="text-center  border border-zinc-700 p-3 px-5"> {item.dbname} </td>
                                    <td class="text-center  border border-zinc-700 p-3 px-5"> {item.dbuser} </td>
                                    <td class="text-right  border border-zinc-700 p-3 px-5"> {formatNumber(item.tblasis)} </td>
                                    <td class="text-right  border border-zinc-700 p-3 px-5"> {formatNumber(item.tbltobe)} </td>
                                    <td class="text-right  border border-zinc-700 p-3 px-5"> {formatNumber(item.idxasis)} </td>
                                    <td class="text-right  border border-zinc-700 p-3 px-5"> {formatNumber(item.idxtobe)} </td>
                                    <td class="text-right  border border-zinc-700 p-3 px-5"> {formatNumber(item.objasis)} </td>
                                    <td class="text-right  border border-zinc-700 p-3 px-5"> {formatNumber(item.objtobe)} </td>
                                    <td class="text-right  border border-zinc-700 p-3 px-5"> {formatNumber(item.invalidasis)} </td>
                                    <td class="text-right  border border-zinc-700 p-3 px-5"> {formatNumber(item.invalidasis)} </td>
                                </tr>
                            {/each}
                            <tr>
                              <th class="text-center bg-zinc-600 border border-zinc-700   p-3 px-5" colspan="2">{$t.loadData.totCnt}</th>
                              <th class="text-right  border border-zinc-700   p-3 px-5">{getSum("tblasis").toLocaleString()}</th>
                              <th class="text-right  border border-zinc-700   p-3 px-5">{getSum("tbltobe").toLocaleString()}</th>
                              <th class="text-right  border border-zinc-700   p-3 px-5">{getSum("idxasis").toLocaleString()}</th>
                              <th class="text-right  border border-zinc-700   p-3 px-5">{getSum("idxtobe").toLocaleString()}</th>
                              <th class="text-right  border border-zinc-700   p-3 px-5">{getSum("objasis").toLocaleString()}</th>
                              <th class="text-right  border border-zinc-700   p-3 px-5">{getSum("objtobe").toLocaleString()}</th>
                              <th class="text-right  border border-zinc-700   p-3 px-5">{getSum("invalidasis").toLocaleString()}</th>
                              <th class="text-right  border border-zinc-700   p-3 px-5">{getSum("invalidasis").toLocaleString()}</th>
                            </tr>
                            <tr>
                              <th class="text-center bg-zinc-600 border border-zinc-700 p-3 px-5" >{$t.loadData.etc}</th>
                              <th class="text-left  border border-zinc-700 p-3 px-5" colspan="9">{@html paginatedList[0].sf.replace(/\r\n|\n/g, "<br>")}</th>
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
                <div class="flex w-full justify-center mt-4">
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

            <!-- 하단-->
            <div class="flex flex-wrap w-full p-3 justify-center">
              <div class="w-full overflow-auto bg-gray-800 p-3 rounded-lg">
                <!-- <div class="w-full border-gray-500  py-3 text-end">
                  <button class="bg-gray-500 hover:bg-sky-500 text-yellow-100 py-2 px-4 rounded focus:outline-none focus:shadow-outline"  on:click={() => {getDetail(chkList[0]?.sqlnocnt); }}>{$t.loadData.btn.diff}</button>
                </div> -->
                <table class="w-full text-md text-nowrap bg-gray-800 text-white  shadow-md rounded mb-4">
                  <thead>
                    <tr class="">
                      <th class="text-center border border-zinc-700  bg-zinc-600 order p-3 px-5" colspan="2">{$t.loadData.dataCheckTitle}</th>
                    </tr>
                    <tr class="">
                      {#each bTableHeader as item, idx}
                        <th class="text-center bg-zinc-600 border border-zinc-700 p-3 px-5">{item}</th>
                      {/each}
                    </tr>
                    </thead>
                    <tbody>
                        {#if chkList.length > 0}
                            {#each chkList as item, index}
                               <tr class="border-b hover:bg-gray-700">
                                    <td class="text-center  border border-zinc-700 p-3 px-5"> {formatNumber(item.sqlcnt)} </td>
                                    <td class="text-center  border border-zinc-700 p-3 px-5"> {formatNumber(item.sqlnocnt)} </td>
                                </tr>
                            {/each}
                           
                            <tr>
                              <th class="text-center bg-zinc-600 border border-zinc-700 p-3 px-5" >{$t.loadData.etc}</th>
                              <th class="text-left  border border-zinc-700 p-3 px-5" colspan="9">{@html chkList[0].sfdata.replace(/\r\n|\n/g, "<br>")}</th>
                            </tr>
                            
                        {:else}
                            <tr>
                                <td colspan="7" class="text-center  border border-zinc-700 p-3 px-5">{$t.com.paging.noData}</td>
                            </tr>
                            <tr>
                              <td class="text-center bg-zinc-600 border border-zinc-700 p-3 px-5" colspan="2">{$t.loadData.totCnt}</td>
                            </tr>
                        {/if}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    {/if}
  </div>
</div>


</div>
{:else}
  <LoadDataVerifyDetail selData={selData} selectedRow={selectedRow}></LoadDataVerifyDetail>
{/if}