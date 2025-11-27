<script lang="ts">
  
  import { onMount } from "svelte";
  import * as XLSX from "xlsx";
  import DonutChart from './DonutChart.svelte';
  import {rooturl, intlMs } from '../aqtstore';
  import TransformBoard from "./TransformBoard.svelte";
  import DashBoard from "./DashBoard.svelte";
  import { writable } from "svelte/store";
  
  export let mid;
  export let wsts;
  export let sts;
  let selectAll = false; // 전체 체크박스 상태
  let selected = true;
  let childMessage = "";
  let pageNm = "시나리오";
  let list = [];
  let checked = false; // 체크 여부 추적
  // let getscenariodetaildata=[
  //   {"pkey":30,"mid":3,"scno":"A-147","scgrp":"1.사전작업","midnm":"시스템나르샤 F","worknm":"시스템이행모니터링","planStdt":"2025-01-21 10:49:24","":"2025-01-21 11:37:24","ActStdt":"2025-01-21 10:49:24","ActEndt":"2025-01-21 11:37:24","esttime":48,"acttime":48,"wstat":0,"scenario":110,"tmignm":"3차 리허설","mgb":1,"startdt":"2025-02-20","endDt":"2025-02-20","mclass":1,"mclassnm":"사전준비"},
  //   {"pkey": 528,"mid": 5,"scno":"C-231","scgrp":"1.사전작업","midnm": "시스템재기동 F","worknm": "시스템이행모니터링","planStdt":"2025-02-06 11:46:44","planEndt":"2025-02-06 12:28:44","ActStdt":"2025-02-06 11:46:44",    "ActEndt": "2025-02-06 11:46:44","esttime": 0,"acttime": 0,"wstat": 0,"wstatnm": "계획","scenario": 100,"tmignm":"1차 본이행","mgb":2,"startdt":"2025-04-20","endDt":"2025-04-21","mclass": 1,"mclassnm":"사전준비"} 
  
  // ]
  let getscenariodetaildata= [];
  function getScenarioSelect(){
    getScenarioDetail()
  }
    // 시나리오 상세내용 조회  sts:9 전체 시나리오 조회
  async function getScenarioDetail () {
    if (sts  != 5) {
      let transformboardlist="/transformscenario/transsc_list?mid="+mid+"&wstat="+wsts
      const transformboardScenario = await fetch($rooturl+transformboardlist);
      if (transformboardScenario.ok){
        getscenariodetaildata= await transformboardScenario.json();
        currentPage = 1; 
        return getscenariodetaildata;
        }else{
          throw new Error(transformboardScenario.statusText);    
        }
    }else{
        let transformboardlist="/transformscenario/transsc_list?mid="+mid+"&wstat="+wsts
        const transformboardScenario = await fetch($rooturl+transformboardlist);
        console.log("transformboardScenario==5"+transformboardScenario);
        
        if (transformboardScenario.ok){
        getscenariodetaildata= await transformboardScenario.json();
        return getscenariodetaildata;
        }else{
          throw new Error(transformboardScenario.statusText);    
        }
    }
  }
  // 데이터 값 확인용
  $: rdata = getscenariodetaildata;
  $:{
    console.log(rdata);
  }

  onMount(async () => {
    getScenarioSelect ();
    // //시나리오 상세 조회
     
    // //alert("sts="+sts);
     if(getscenariodetaildata.length !=0){
       console.log(getscenariodetaildata)
     }
  });

  // 이전 페이지로 이동
  function goToPreviousPage() {
    if (currentPage > 1) {
      currentPage--;
    }
  }
  // 상세페이지에서 이전 버튼
  function   BeforeScenario() {
    selected=false;
  }

//  let selectedStatus = "99";
  let currentPage = 1;
  let itemsPerPage = 10;

  $: paginatedlist = wsts == "99" ?
    getscenariodetaildata.slice((currentPage - 1) * itemsPerPage,currentPage * itemsPerPage)
   : getscenariodetaildata.filter(getscenariodetaildata => wsts == getscenariodetaildata.wstat).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage); 
  
  $: totalPages = Math.ceil((wsts == "99" ? getscenariodetaildata.length : getscenariodetaildata.filter(item => item.wstat == wsts).length) / itemsPerPage);
  
// 페이징 초기화 함수
function initializePagination() {
    currentPage = 1; // 페이지를 첫 번째 페이지로 초기화
  }
// 전체 선택/해제 핸들러
  function toggleAll() {
    getscenariodetaildata = getscenariodetaildata.map(item => ({ ...item, checked: selectAll }));
  };

  // 개별 체크박스 상태 변경 시 호출되는 핸들러
  function updateSelection() {
    selectAll = getscenariodetaildata.every(item => item.checked); // 개별 체크박스가 모두 체크되면 전체 체크박스도 체크
  };

  // 각 로우(시작날짜,종료날짜) 클릭 시 체크박스 상태 변경
  function toggleCheckboxrow(index: number){
    if(paginatedlist[index].checked == false){
      paginatedlist[index].checked = !paginatedlist[index].checked;
    }
  }
  
  function goToPage(page) {
       if (page > 0 && page <= totalPages) {
          currentPage = page;
      }
  }

  function excelDown(){
    // 🔹 헤더 추가
    let header =  ["TASKID",
                    "주제영역",
                    "Level1(단계)",
                    "Level2",
                    "Level3(TASK)",
                    "TaskDetail",
                    "선행ID",
                    "병행ID",
                    "소요",
                    "시작",
                    "종료",
                    "소요",
                    "시작",
                    "종료",
                    "SI",
                    "SM",
                    "수행서버",
                    "작업 방안(Commandlevel)",
                    "진행상태",
                    "출력여부"
                  ];
    
    // 🔹 JSON 데이터를 배열로 변환 (첫 줄은 헤더)
    let worksheetData = [header, ...getscenariodetaildata.map(obj => [
                                                                    obj.scno 
                                                                    ,obj.scgrp
                                                                    ,obj.mclassnm 
                                                                    ,obj.scgrp
                                                                    ,obj.desc
                                                                    ,obj.pscno
                                                                    ,obj.cscno
                                                                    ,obj.esttime
                                                                    ,obj.planStdt
                                                                    ,obj.planEndt
                                                                    ,obj.acttime 
                                                                    ,obj.acttime
                                                                    ,obj.actstdt 
                                                                    ,obj.actendt
                                                                    ,obj.siuser
                                                                    ,obj.smuser
                                                                    ,obj.pserver
                                                                    ,obj.worknm
                                                                    ,obj.wstatnm
                                                                    ,obj.disyn
                                                                  ]) 
                        ];

    // 🔹 워크시트 생성
    let ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // 🔹 워크북 생성 및 워크시트 추가
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // 🔹 엑셀 파일 생성 및 다운로드
    XLSX.writeFile(wb, "시나리오.xlsx");
  }

   // 저장 버튼 클릭 시 처리 함수
  const onSave = () => {
    // 선택된 항목 확인
    const selectedItems = paginatedlist.filter(item => item.checked);
   if (selectedItems.length === 0) {
   alert("체크박스를 선택하세요.");
   } else {
   alert(`${selectedItems.length}개의 항목이 선택되었습니다.`);
      if (confirm("저장 하시겠습니까?")) {
      // 저장할 데이터를 준비합니다.
      const dataToSave = selectedItems.map(item => ({
        mid:      item.mid,
        pkey:     item.pkey,
        actstdt: item.actstdt,
        actendt: item.actendt,
        wstat:    item.wstat
        // 여기에 더 필요한 데이터를 추가 
      }));
       if(!dataToSave[0].actstdt ){
        alert("시작 날짜를 선택 해주세요.");
        return false;
       }
       else if (dataToSave[0].actendt == null) {
        dataToSave[0].actendt="";
       } else if (dataToSave[0].actstdt  > dataToSave[0].actendt && dataToSave[0].actendt != "1900-01-01 00:00:00" && dataToSave[0].actendt !="") {
        alert("종료 날짜와 시간은 시작 날짜와 시간 이후여야 합니다.")        
        return false;
       } else{

       }
              
       let serveUrl=$rooturl+'/transformscenario/transsc_save'
      fetch(serveUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave), // 데이터를 JSON으로 전달
      })
        .then(async (res) => {
          
          let rmsg = await res.json();
                if (res.status == 200 && rmsg.rdata===1) {
                  alert("저장이 되었습니다.");
                  getScenarioDetail();
            // 추가적으로 저장 후 화면을 업데이트 할 수 있는 로직
          } else {
            throw new Error('저장 실패');
          }
        })
        .catch(error => {
          alert("저장이 실패했습니다.");
          console.error('Error saving data:', error);
        });
      }  
    }
  };

  function handleChildEvent(event) {
      childMessage = event.detail; // 자식에서 전달된 값 저장
      //alert("childMessage="+childMessage.flag +" " +childMessage.mid);
    
      getScenarioDetail(childMessage.mid,childMessage.flag);
    }

// 버튼 클릭 핸들러
// async function downloadFile(): Promise<void> {//서버 연결 시 
  async function downloadFile() {
  try {
    // 파일 URL (서버에서 제공하는 파일 경로)
    const fileUrl = "/api/files/체크리스트.zip";

    // 파일 요청
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    // 파일을 Blob으로 변환
    const blob = await response.blob();

    // Blob URL 생성
    const url = window.URL.createObjectURL(blob);

    // 다운로드를 위한 링크 생성
    const a = document.createElement("a");
    a.href = url;

    // 파일명 추출 또는 기본 이름 설정
    const contentDisposition = response.headers.get("Content-Disposition");
    const fileName = contentDisposition
      ? contentDisposition
          .split("filename=")[1]
          ?.replace(/['"]/g, "") || "체크리스트.zip"
      : "체크리스트.zip";

    a.download = fileName;
    document.body.appendChild(a);

    // 다운로드 트리거 및 링크 제거
    a.click();
    document.body.removeChild(a);

    // Blob URL 해제
    window.URL.revokeObjectURL(url);

    console.log(`File downloaded successfully: ${fileName}`);
  } catch (error) {
    console.error("Error downloading file:", error);
    alert("파일 다운로드 중 오류가 발생했습니다.");
  }
}

  const statusOptions = [
    { value: 99, label:"전체" },
    { value: 0, label: "계획" },
    { value: 1, label: "진행중" },
    { value: 2, label: "완료" },
    { value: 3, label: "미수행" }
  ]; 
  
  const selectedStatus = [
    { value: 0, label: "계획" },
    { value: 1, label: "진행중" },
    { value: 2, label: "완료" },
    { value: 3, label: "미수행" }
  ];
</script>

<style>
  .input-boder {
    
    padding: 8px;
    margin-bottom: 10px;
    border-bottom: 1px solid #ccc;
    border-radius: 4px;
  }
th {
    background-color: #333; /* 헤더 배경 색상 */
    color: yellow; /* 헤더 텍스트 색상 */
    text-align: center;
}

td {
    padding: 8px; /* 패딩 추가 */
    text-align: center; /* 중앙 정렬 */
}

tr:hover {
    background-color: darkgrey; /* 호버 시 배경 색상 */
}
</style>
{#if selected}
<div class="mx-auto p-3 w-12/12 h-5/6">
  <div class="flex justify-between">
    <div class="flex flex-wrap flex-row items-center mx-2 w-full ">
          <div class="flex-col bg-gray-700 rounded-lg w-full" >
            <div class="flex w-full  border-b-2 border-gray-500 items-center">
              </div>
              <div class="flex justify-end items-center w-full mt-3">
                <div class="px-4 text-start ">
                </div> 
                <div class="flex gap-4 justify-end mr-14 mt-2">
                  {#if sts !=5}
                  <label class="text-gray-300">상태</label>
                  <select class="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-10"
                  bind:value={wsts} on:change={getScenarioDetail}>
                  {#each statusOptions as item}
                  <option value={item.value}>{item.label}</option>
                  {/each}
                </select>
                <button  class="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"on:click={() =>{onSave()}}> 
                  저장
                </button>

                  {:else}
                  
                  {/if}
                  <!-- <button  class="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"on:click={() =>{TransformBoardSave()}}> -->
                  <button  class="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded" on:click={downloadFile}>
                    첨부파일 다운로드
                  </button>
                  <button class="bg-green-500 hover:bg-green-700 text-yellow-100 py-2 px-4 rounded focus:outline-none focus:shadow-outline" on:click={() =>{excelDown()}} >
                    Excel download
                  </button>
                  <button class="bg-gray-500 hover:bg-sky-500 text-yellow-100 py-2 px-4 rounded focus:outline-none focus:shadow-outline text-end"  on:click={() => {  BeforeScenario() }}>이전보기</button>
                </div>
              </div>
              
              <div class="flex flex-wrap w-full p-3 justify-center " >
                  <div class="w-full overflow-auto bg-gray-800 p-3 rounded-lg"  >
                  <table class="w-full text-md bg-gray-800 text-white text-nowrap shadow-md rounded mb-4" style="border: 1px solid #ccc">
                    <thead>
                    <tr class="border-b text-sm w-full">
                      <th class="text-left p-3 px-5  border border-white sticky left-0" style="text-align: center; background-color: #38bdf8;" colspan="3">구분</th>
                      <th class="text-left p-3 px-5 border border-white" style="text-align: center;" colspan="6">작업 TASK</th>
                      <th class="text-left p-3 px-5 border border-white" style="text-align: center;" colspan="3">본이행 예상소요시간</th>
                      <th class="text-left p-3 px-5 border border-white" style="text-align: center;" colspan="3">실제 소요시간</th>
                      <th class="text-left p-3 px-5 border border-white" style="text-align: center;" colspan="2">등록자(작업자)</th>
                      <th class="text-left p-3 px-5 border border-white" style="text-align: center;" colspan="2">작업 방법 및 원복방안</th>
                      <th class="text-left p-3 px-5 border border-white" style="text-align: center;" rowspan="2">진행상태</th>
                      <th class="text-left p-3 px-5 border border-white" style="text-align: center;" rowspan="2">출력여부</th>
                      
                  </tr>
                  <tr class="border-b text-sm">
                      <!-- <th class="text-left p-3 px-5 border border-white"><input type="checkbox" bibind:checked={checkboxAll} on:change={toggleAll} ></th> -->
                      <th class="text-left p-3 px-5 border border-white sticky left-0" style="background-color: #38bdf8;"><input type="checkbox" bind:checked={selectAll} on:change={toggleAll}></th>
                      <th class="text-left p-3 px-5 border border-white sticky" style="background-color: #38bdf8; left: 54px;">TASKID</th>
                      <th class="text-left p-3 px-5 border border-white  {paginatedlist.length > 0 ? 'sticky' : ''}" style="background-color: #38bdf8; {getscenariodetaildata.length > 0 ? 'left: 248px;' : ''}">주제영역</th>
                      <!-- <th class="text-left p-3 px-5 border border-white">위치</th>
                      <th class="text-left p-3 px-5 border border-white">파트/작업 위치</th> -->
                      <th class="text-left p-3 px-  border border-white">Level1(단계)</th>
                      <th class="text-left p-3 px-  border border-white">Level2</th>
                      <th class="text-left p-3 px-  border border-white">Level3(TASK)</th>
                      <th class="text-left p-3 px-  border border-white">TaskDetail</th>
                      <th class="text-left p-3 px-  border border-white">선행ID</th>
                      <th class="text-left p-3 px-  border border-white">병행ID</th>
                      <th class="text-left p-3 px-  border border-white">소요</th>
                      <th class="text-left p-3 px-  border border-white">시작</th>
                      <th class="text-left p-3 px-  border border-white">종료</th>
                      <th class="text-left p-3 px-  border border-white">소요</th>
                      <th class="text-left p-3 px-  border border-white">시작</th>
                      <th class="text-left p-3 px-  border border-white">종료</th>
                      <th class="text-left p-3 px-  border border-white">SI</th>
                      <th class="text-left p-3 px-  border border-white">SM</th>
                      <th class="text-left p-3 px-  border border-white">수행서버</th>
                      <th class="text-left p-3 px-  border border-white">작업 방안(Commandlevel)</th>
                  </tr> 
              </thead> 

                      <tbody>

                      {#if paginatedlist.length > 0}
                        {#if sts !=5}
                          {#each paginatedlist as item, index}
                                  <tr class="border-b hover:bg-orange-100 border-spacing-4 {index % 2 === 0 ? '' : ''}">
                                      <td class="p-3 px-5  border border-white sticky left-0" style="background-color: #38bdf8;">
                                        <!-- <input type="checkbox"  bind:checked={item.checked} on:change={toggleItem} /> 개별 체크박스 선택 시 전체 선택 상태 업데이트 -->
                                        <!-- <input type="checkbox"  checked /> -->
                                        <input type="checkbox"  bind:checked={item.checked} />
                                      </td>
                                      <td class="p-3 px-5 border border-white sticky" style="background-color: #38bdf8; left: 54px;">
                                          <input type="text" bind:value={item.scno} class="bg-transparent text-center"disabled/> 
                                      </td>
                                      <td class="p-3 px-5 border border-white sticky" style="background-color: #38bdf8; left: 248px;">
                                          <input type="text" bind:value={item.midnm} class="bg-transparent text-center"disabled/>
                                      </td>
                                      <!-- <td class="p-3 px-5 border border-white">
                                          <input type="text" bind:value={item.scno} class="bg-transparent" disabled/> 
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                        <input type="text" bind:value={item.scgrp} class="bg-transparent "disabled/>
                                      </td> -->
                                      <td class="p-3 px-5 border border-white">
                                          <input type="text" bind:value={item.mclassnm} class="bg-transparent"disabled/>
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                          <input type="text" bind:value={item.scgrp} class="bg-transparent"disabled/>
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                        <input type="text" bind:value={item.desc} class="bg-transparent"disabled/>
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                        <input type="text" bind:value={item.pscno} class="bg-transparent"disabled/>
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                          <input type="text" bind:value={item.cscno} class="bg-transparent "disabled/>
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                        <input type="text" bind:value={item.esttime} class="bg-transparent"disabled/>
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                        <input type="text" bind:value={item.planStdt} class="bg-transparent"disabled/> 
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                          <input type="text"  bind:value={item.planEndt} class="bg-transparent"disabled/>
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                          <input type="text" bind:value={item.acttime} class="bg-transparent"disabled/> 
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                        <input type="text" bind:value={item.acttime} class="bg-transparent"disabled/> 
                                    </td>
                                      <!-- <td class="p-3 px-5 border border-white">
                                        <input type="text" bind:value={item.actstdt} class="bg-transparent" disabled/> 
                                      </td> -->
                                      <td class="p-3 px-5 border border-white" on:click={() => toggleCheckboxrow(index)}>
                                          <input type="datetime-local" bind:value={item.actstdt} class="bg-transparent" />
                                          <!-- <input type="text" bind:value={item.actstdt}  class="bg-transparent"/> -->
                                      </td>
                                      <td class="p-3 px-5 border border-white" on:click={() => toggleCheckboxrow(index)}>
                                          <!-- {#if item.actendt == "1900-01-01 00:00:00"}
                                          <input type="datetime-local"  class="bg-transparent" />
                                          {:else}
                                          <input type="datetime-local" bind:value={item.actendt}  class="bg-transparent"/>
                                          {/if} -->
                                          {#if item.actendt == "1900-01-01 00:00:00"}
                                          {item.actendt=""}
                                          {/if}
                                          <input type="datetime-local" bind:value={item.actendt}  class="bg-transparent"/>
                                      </td>
                                     <td class="p-3 px-5 border border-white">
                                        <input type="text" bind:value={item.siuser} class="bg-transparent" disabled/>
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                        <input type="text" bind:value={item.smuser} class="bg-transparent" disabled/>
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                        <input type="text" bind:value={item.pserver} class="bg-transparent" disabled/>
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                          <input type="text" bind:value={item.worknm} class="bg-transparent"disabled/>
                                      </td>
                                      <td class="p-3 px-5 border border-white">
                                      <!-- <input type="text" bind:value={item.wstatnm} class="bg-transparent" disabled/>
                                      <input type="text" bind:value={item.wstat} class="bg-transparent" disabled/> -->
                                      <select class="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-10"
                                        bind:value={item.wstat} >
                                        {#each selectedStatus as item}
                                        <option value={item.value}>{item.label}</option>
                                        {/each}
                                      </select>
                                    </td>
                                      <td class="p-3 px-5 border border-white">
                                        <input type="text" bind:value={item.disyn} class="bg-transparent" disabled/>
                                    </td>
                                    
                                 </tr>
                              {/each}
                        {:else}
                            {#each paginatedlist as item, index}
                            <tr class="border-b hover:bg-orange-100 border-spacing-4 {index % 2 === 0 ? '' : ''}">
                              <td class="p-3 px-5  border border-white">
                                <!-- <input type="checkbox"  bind:checked={item.checked} on:change={toggleItem} /> 개별 체크박스 선택 시 전체 선택 상태 업데이트 -->
                                <!-- <input type="checkbox"  checked /> -->
                                <input type="checkbox"  disabled />
                              </td>
                              <td class="p-3 px-5 border border-white">
                                  <input type="text" bind:value={item.scno} class="bg-transparent text-center"disabled/> 
                              </td>
                              <td class="p-3 px-5 border border-white">
                                  <input type="text" bind:value={item.midnm} class="bg-transparent text-center"disabled/>
                              </td>
                              <!-- <td class="p-3 px-5 border border-white">
                                  <input type="text" bind:value={item.scno} class="bg-transparent" disabled/> 
                              </td>
                              <td class="p-3 px-5 border border-white">
                                <input type="text" bind:value={item.scgrp} class="bg-transparent "disabled/>
                              </td> -->
                              <td class="p-3 px-5 border border-white">
                                  <input type="text" bind:value={item.mclassnm} class="bg-transparent"disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                  <input type="text" bind:value={item.scgrp} class="bg-transparent"disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                <input type="text" bind:value={item.desc} class="bg-transparent"disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                <input type="text" bind:value={item.pscno} class="bg-transparent"disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                  <input type="text" bind:value={item.cscno} class="bg-transparent "disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                <input type="text" bind:value={item.esttime} class="bg-transparent"disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                <input type="text" bind:value={item.planStdt} class="bg-transparent"disabled/> 
                              </td>
                              <td class="p-3 px-5 border border-white">
                                  <input type="text"  bind:value={item.planendt} class="bg-transparent"disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                  <input type="text" bind:value={item.acttime} class="bg-transparent"disabled/> 
                              </td>
                              <td class="p-3 px-5 border border-white">
                                <input type="text" bind:value={item.acttime} class="bg-transparent"disabled/> 
                            </td>
                              <!-- <td class="p-3 px-5 border border-white">
                                <input type="text" bind:value={item.actstdt} class="bg-transparent" disabled/> 
                              </td> -->
                              <td class="p-3 px-5 border border-white">
                                  <input type="datetime-local" bind:value={item.actstdt} class="bg-transparent" disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                  <input type="datetime-local" bind:value={item.actendt}  class="bg-transparent"disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                <input type="text" bind:value={item.siuser} class="bg-transparent" disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                <input type="text" bind:value={item.smuser} class="bg-transparent" disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                <input type="text" bind:value={item.pserver} class="bg-transparent" disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                  <input type="text" bind:value={item.worknm} class="bg-transparent"disabled/>
                              </td>
                              <td class="p-3 px-5 border border-white">
                                <input type="text" bind:value={item.wstat} class="bg-transparent" disabled/>
                                
                            </td>
                              <td class="p-3 px-5 border border-white">
                                <input type="text" bind:value={item.flag} class="bg-transparent" disabled/>
                            </td>
                          </tr>
                            {/each} 
                        {/if}
                        {:else}
                            <tr>
                                <td colspan="23" class="p-3 px-5 text-center text-yellow-100">시나리오가 없습니다.</td>
                            </tr>
                      {/if}
                      </tbody>
                  </table>
                  </div>
                  <div class="flex w-full justify-center mt-4">
                    <button class="px-3 py-1 bg-gray-500 text-yellow-100 rounded mx-1 hover:bg-gray-700" on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                      Previous
                    </button>
                    {#each Array(totalPages).fill() as _, pageIndex}
                        <button class="px-3 py-1 bg-gray-300 text-black rounded mx-1 hover:bg-gray-500" class:bg-gray-700={pageIndex + 1 === currentPage} on:click={() => goToPage(pageIndex + 1)}>
                            {pageIndex + 1}
                        </button>
                    {/each}
                    <button class="px-3 py-1 bg-gray-500 text-yellow-100 rounded mx-1 hover:bg-gray-700" on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                       Next
                    </button>
                </div>
              </div>
          </div>
      </div>
    </div>

</div>
{:else}
<TransformBoard></TransformBoard>
{/if}
