<script>
  import PerformDetail from "./PerformDetail.svelte";
  import StackedBar from "./StackedBar.svelte";
  import PieChart from "./PieChart.svelte";
  import { onMount } from "svelte";
  import {rooturl, t} from '../aqtstore';
  let selectedValue = '';
  let selected = true;
  let leftDates = [];
  let selData;
  let childBarRef;
  let childPieRef;
  
  //차수, ASIS 일자, TOBE 일자 조회
  async function getPerformcomposit() {
    const res = await fetch($rooturl + "/performcomposit" );
    if (res.ok){
      return await res.json();
    }else
      throw new Error(res.statusText);
  }

  onMount(async () => {
    leftDates = await getPerformcomposit();
    //[{"seq":"1차","asisdt":"2025-01-02","lastDt":"2025-01-20"}]
    if(leftDates.length > 0){
      selData = leftDates[selectedRow];
    }
    //[{"tname":"성능1차 테스트 결과","lastDt":"2025-01-20"}]
  });
  let selectedRow = 0;

  const handleRowClick = (idx) => {
    selectedRow = idx; // 현재 클릭된 row의 seq를 기준으로 선택 상태 설정
    selData = leftDates[idx];
    if(childBarRef) childBarRef.parentCall();
    if(childPieRef) childPieRef.parentCall();
  };
</script>
{#if selected}
<div class="mx-auto p-3 w-10/12 h-5/6">
<div class="flex justify-between">
  <div class="w-3/12 bg-gray-700 rounded-lg flex-wrap p-3" >
    <div class="flex  border rounded border-zinc-600  text-zinc-100 ">
      <label class="px-3 w-2/6 py-2 border-r border-l  border-zinc-600 ">{$t.perform.leftTitle}</label>
      <label class="px-3 w-2/6 py-2 border-r border-l  border-zinc-600 ">{$t.perform.leftDate1}</label>
      <label class="px-3 w-2/6 py-2 border-r border-l  border-zinc-600 ">{$t.perform.leftDate2}</label>
    </div>
    {#if leftDates.length !== 0}
      {#each leftDates as item, idx}
          <div class="flex mb-3 border rounded border-zinc-600 text-zinc-100 " on:click={() => { handleRowClick(idx);}}>
            <label class="px-3 w-2/6 py-2 border-r border-l bg-zinc-700 border-zinc-600 {selectedRow === idx ? 'text-yellow-100' : ''}">{item.tname}</label>
            <input type="text" class="w-2/6 pl-3 border-r  bg-zinc-700 border-zinc-600 {selectedRow === idx ? 'text-yellow-100' : ''}" value="{item.asisdt}" readonly>
            <input type="text" class="w-2/6 pl-3 border-r  bg-zinc-700 border-zinc-600 {selectedRow === idx ? 'text-yellow-100' : ''}" value="{item.tobedt}" readonly>
        </div>
      {/each}
    {/if}
  </div>
    <div class="flex flex-wrap flex-row items-center mx-2 w-9/12">
      {#if selData}
          <div class="flex-col bg-gray-700 rounded-lg w-full" >
            <div class="flex w-full  border-b-2 border-gray-500 items-center">
                <h1 class="text-2xl w-3/5 tracking-tight text-yellow-100 p-3">{selData.tname} {$t.perform.title}</h1>
                <h1 class="text-1xl w-2/5 text-end tracking-tight text-yellow-100 p-3" >{$t.perform.date} {selData.tobedt}</h1>
                <div class="w-36 px-4 text-end">
                  <button class="bg-gray-500 hover:bg-sky-500 text-yellow-100 py-2 px-4 rounded focus:outline-none focus:shadow-outline"  on:click={() => { selected = false; }}>{$t.com.btn.detail}</button>
                </div> 
              </div>
              <div class="flex flex-wrap w-full p-3 justify-center">
                <div class="flex bg-gray-800 p-3 rounded-lg my-3 w-11/12 justify-center items-center">
                  <div class="flex w-2/6  justify-center items-center">
                    <PieChart page={'P'} selData={selData} title={selData.tname} bind:this={childPieRef} ></PieChart>
                  </div>
                </div>
                <div class="flex justify-center bg-gray-800 p-3 rounded-lg w-11/12 ">
                  <div class="w-9/12">
                    <StackedBar page={'P'} selData={selData} bind:this={childBarRef} ></StackedBar> 
                  </div>
                </div>
                
              </div>
          </div>
    {/if}
  </div>
</div>
</div>
{:else}
  <PerformDetail selData={selData} selectedRow={selectedRow}></PerformDetail>
{/if}