<script lang="ts">
  import Chart from 'chart.js/auto';
  import ChartDataLabels from 'chartjs-plugin-datalabels';
  import { onMount, createEventDispatcher } from "svelte";
  import {rooturl, intlMs } from '../aqtstore';
  import { get } from 'svelte/store';
  let { item,getscenariodetaildata, sts } = $props();
  let selflag;
  let mid;
  let childMessage = "";
  // 플러그인 등록
  Chart.register(ChartDataLabels);
  let ctx, chartx;
  let chartCanvas;

  let totalSum = item.totrate;
  // 플러그인 정의
  const centerTextPlugin = {
  id: "centerText",
  beforeDraw(chart) {
    const { width, height, ctx } = chart;
    ctx.restore();
    const fontSize = 2;
    ctx.font = `${fontSize}em sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    // 중앙에 총합 표시
    ctx.fillText(` ${totalSum}%`, width / 2, height - 50);
    ctx.save();
  },
};

  let config = {
    type: "doughnut",
    data: {
      // "이행전광판 우측(Task건수, 계획건수, 진행중건수, 작업완료건수, 작업오류건수, 비율(완료건수/Task건수)"
    labels: [ '계획', '진행중', '완료','미수행'],
    datasets: [
      {
        label: '',
        data: [100, 19, 3, 5],
        backgroundColor:['#34c38f'],
        circumference: 180, // 도넛 반 자르기
        rotation: 270,
        backgroundColor: [
          "#ff6384", "#3cba9f","#b604ce","#e8c3b9"
        //   'rgba(153, 102, 255, 0.2)',
        //   'rgba(255, 159, 64, 0.2)',
        ],
        // borderColor: [
        //   'rgba(255, 99, 132, 1)',
        //   'rgba(54, 162, 235, 1)',
        //   'rgba(255, 206, 86, 1)',
        //   'rgba(75, 192, 192, 1)',
        //   'rgba(153, 102, 255, 1)',
        //   'rgba(255, 159, 64, 1)',
        // ],
        borderWidth: 0,
      },
    ],
  },
  plugins:[centerTextPlugin],

  options: {
   
    responsive: true,
    maintainAspectRatio: true,
    
    // aspectRatio: 1, // 차트를 정사각형으로 유지
    plugins: {
      datalabels: {
        color: 'white', // 텍스트 색상
        anchor: 'center', // 라벨 위치 조정
        align: 'center', // 라벨 정렬
        font: {
          size: 25, // 폰트 크기
        },
        formatter: function (v, ctx) {
            let num = parseFloat(v); // 안전하게 숫자로 변환
            if (!isNaN(num) && num !== 0) {
              return num.toLocaleString(); // 숫자인 경우, 천 단위 콤마 추가
            }
            return "";
          }, // 표시할 값 (기본은 데이터 값)
      },
      legend: {
        display: true, // 범례 표시 여부
        labels:{color:'#fff',
          boxWidth:14
        }
      },
      title: {
        display: true,
        // text: '타이틀 임시',
        text:"",  // 동적으로 생성된 제목 사용
        font:{size:20},
        color:'white'
      },
    },
  },
  };
//   mid		-- 이행코드
// scgrp
// plancnt	-- 수행시나리오계획건수
// ingcnt		-- 수행시나리오진행중건수
// comcnt		-- 수행시나리오작업완료건수
// errcnt		-- 수행시나리오작업오류건수
// totcnt		-- 수행시나리오건수
// totrate	-- 비율(수행시나리오건수/총시나리오건수)
// "이행전광판 우측(Task건수, 계획건수, 진행중건수, 작업완료건수, 작업오류건수, 비율(완료건수/Task건수)"
  function chartDraw(){
    console.log(item);
    config.data.datasets[0].data = [item.plancnt,item.ingcnt,item.comcnt,item.errcnt];
    console.log(item.scgrp)

    //1~타이틀
    config.options.plugins.title.text = [item.scgrp];
    
    chartx.update();
  }
// 시나리오 상세내용 조회  sts:9 전체 시나리오 조회
async function getScenarioDetail (mid:number,scenarioAll:number,sts:number) {
    let transformboardlist="/transformscenario/transsc_list?mid="+mid+"&wstat="+scenarioAll
    const transformboardScenario = await fetch($rooturl+transformboardlist);
    console.log("transformboardScenario=="+transformboardScenario);
    
    if (transformboardScenario.ok)
      return await transformboardScenario.json();
    else
      throw new Error(transformboardScenario.statusText);    
  }
  onMount(async () => {
    ctx = chartCanvas.getContext("2d");
    chartx = new Chart(ctx, config);
    chartDraw();
   
  });
  // 박스 데이터 타입 정의
  interface ChartTitle {
    title: string;
   
  }
  // interface ChartProjet {
  //   project: string;
  // }

  // // 프로젝트 
  // const chartProjet: ChartProjet[] = [
  //   { project: "마이테이타" },
  //   { project: "자산관리" },

  // ];
  // 박스 데이터 배열( 테스트 데이타)
  // const chartTitle: ChartTitle[] = [
  //     // 상단 종합 현황 차트
  //     { title: "선행 차수 종합 현황" },
  //     // 첫번 째 프로젝트 
  //     { title: "1.사전작업" },
  //     { title: "2.사전이행" },
  //     { title: "3.본 이행" },
  //     { title: "4.사후 작업" },
      
  //     { title: "Box 2" },
  //     { title: "Box 3" },
  //     { title: "Box 4" }
  // ];
  // 차트 제목을 chartTitle 배열을 기반으로 동적으로 생성하는 함수
  // const generateTitle = () => {
  //   return chartTitle.map(item => `${item.title}`).join(' | ');
  // };
  // async function getData() {
  //   const res = await fetch("/barChart");
  //   if (res.ok)
  //     return await res.json();
  //   else
  //     throw new Error(res.statusText);
  // }
  
  // setInterval(async() => {
  //   // let lables = ['계좌2', '공통', '대외', '모바일', '빅데이터', '신용','정산','출납'];
  //   // hartx.data.labels = lables;
  //   const rdata = await getData() ;
  //   config.data.datasets[0].data = rdata.data ;
  //   console.log(config.data.datasets[0].data);
  //   chartx.update();
  // }, 5000);
  // setInterval(async() => {
  //   config.data.datasets[0].data = [Math.floor(Math.random() * 100), 
  //       Math.floor(Math.random() * 100), 
  //       Math.floor(Math.random() * 100), 
  //       Math.floor(Math.random() * 100)
  //   ];
  //   chartx.update()
  // }, $intlMs);

  // statusData 배열을 정의
  interface StatusItem {
    label: string;
    count: number;
  }
// "이행전광판 우측(Task건수, 계획건수, 진행중건수, 작업완료건수, 작업오류건수, 비율(완료건수/Task건수)"
// item.totcnt,item.plancnt,item.ingcnt,item.comcnt,item.errcnt
  const statusData: StatusItem[] = [
    { label: "Task", count: item.totcnt   ,flag: 99,mid:item.mid},
    { label: "계획", count: item.plancnt  ,flag: 0,mid:item.mid},
    { label: "진행중", count: item.ingcnt ,flag: 1,mid:item.mid},
    { label: "완료", count: item.comcnt   ,flag: 2,mid:item.mid},
    { label: "미수행", count: item.errcnt ,flag: 3,mid:item.mid}
    
    // { label: "Task", count: 100 },
    // { label: "완료", count: 4 },
    // { label: "진행중", count: 3 },
    // { label: "계획", count: 3 },
    // { label: "미수행", count: 93 }
  ];
  const dispatch = createEventDispatcher();
  function call(flag,mid){
    childMessage=flag;
    dispatch("message",{"flag":flag, "mid":mid});
    }
</script>
<style>
  .item {
    width: 25%;
    text-align: center;
    margin-top: -1.25rem; /* mt-5 */
    border: 1px solid #ccc; /* border 추가 */
    padding: 0.5rem; /* padding 추가 */
  }

  .testCol{
    color: aliceblue;
  }
  
</style>
  <canvas bind:this={chartCanvas} id="myChart"></canvas>
  <div class="flex w-full ">
    <!-- <span class="w-1/4 text-center -mt-5 item">
      Task  <br>
      100  
    </span>
    <span class="w-1/4 text-center -mt-5 item">
      완료  <br>
      4
    </span>
    <span class="w-1/4 text-center -mt-5 item">
      진행중  <br>
      3
    </span>
    <span class="w-1/4 text-center -mt-5 item">
      미수행  <br>
     93
    </span> -->

    {#each statusData as { label, count,flag,mid}}
    <span class="w-1/3 text-center -mt-5 item mb-1 testCol text-xs">
     <div on:click={() => {call(flag,mid)}}>
      {label} <br>
      {count}<br>
      {selflag}
    </div>
    </span>
  {/each}
  </div>
  
