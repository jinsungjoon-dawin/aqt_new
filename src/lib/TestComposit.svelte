<script>
  import TestDetail from "./TestDetail.svelte";
  import PieChart from "./PieChart.svelte";
  import StackedBar from "./StackedBar.svelte";
  import { onMount } from "svelte";
  import {rooturl, t} from '../aqtstore';
  let selected = true;
  let selectedRow = 0;
  let leftDates = [];
  let selData;
  let childBarRef;
  let childPieRef;
  
  //차수, ASIS 일자, TOBE 일자 조회
  async function getTestcomposit() {
    const res = await fetch($rooturl + "/testcomposit");
    if (res.ok){
      return await res.json();
    }else
      throw new Error(res.statusText);
  }

  onMount(async () => {
    leftDates = await getTestcomposit();
    if(leftDates.length > 0){
      selData = leftDates[selectedRow];
    }
  });
  
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
    <div class="flex  border border-gray-100 rounded border-zinc-600  text-zinc-100 ">
      <label class="px-3 w-2/5 py-2 border-gray-100 border-r border-l  border-zinc-600 ">{$t.test.leftTitle}  </label>
      <label class="px-3 w-3/5 py-2 border-gray-100 border-r border-l  border-zinc-600 ">{$t.test.leftDate}</label> 
    </div>
    {#if leftDates.length !== 0}
      {#each leftDates as item, idx}
          <div class="flex mb-3 border border-gray-100 rounded border-zinc-600 text-zinc-100 " on:click={() => handleRowClick(idx)}>
            <label class="px-3 w-2/5 py-2 border-gray-100 border-r border-l bg-zinc-700 border-zinc-600 {selectedRow === idx ? 'text-yellow-100' : ''}">{item.tname}</label>
            <input type="text" class="w-3/5 pl-3 border-gray-100 border-r  bg-zinc-700 border-zinc-600 {selectedRow === idx ? 'text-yellow-100' : ''}" value="{item.tobedt}" readonly> 
          </div>
      {/each}
    {/if}
  </div>
    <div class="flex flex-wrap flex-row items-center mx-2 w-9/12">
        {#if selData}
        <div class="flex-col bg-gray-700 rounded-lg w-full" >
          <div class="flex w-full  border-b-2 border-gray-500 items-center">
              <h1 class="text-2xl w-3/5 tracking-tight text-yellow-100 p-3">{selData?.tname} {$t.test.title}</h1>
              <h1 class="text-1xl w-2/5 text-end tracking-tight text-yellow-100 p-3">{$t.test.date} {selData.tobedt}</h1>
              <div class="w-36 px-4 text-end">
                <button class="bg-gray-500 hover:bg-sky-500 text-yellow-100 py-2 px-4 rounded focus:outline-none focus:shadow-outline"  on:click={() => { selected = false; }}>{$t.com.btn.detail}</button>
              </div>  
            </div>
            <div class="flex flex-wrap w-full p-3 justify-center">
              <div class="flex bg-gray-800 p-3 rounded-lg my-3 w-11/12 justify-center items-center">
                <div class="flex w-2/6  justify-center items-center">
                  <PieChart page={'T'} selData={selData} bind:this={childPieRef} title={selData.tname} ></PieChart>
                </div>
              </div>
              <div class="flex justify-center bg-gray-800 p-3 rounded-lg w-11/12 ">
                <div class="w-9/12">
                  <StackedBar page={'T'} selData={selData} bind:this={childBarRef} ></StackedBar>
                </div>
              </div>
              
            </div>
        </div>
        {/if}
  </div>
</div>
</div>
{:else}
  <TestDetail selData={selData} selectedRow={selectedRow}></TestDetail>
{/if}
