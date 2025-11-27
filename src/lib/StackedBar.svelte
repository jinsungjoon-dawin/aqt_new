<script lang="ts">
  import Chart from "chart.js/auto";
  import ChartDataLabels from "chartjs-plugin-datalabels";
  import { onMount, onDestroy } from "svelte";
  import { rooturl, intlMs, t } from "../aqtstore";
  // 플러그인 등록
  Chart.register(ChartDataLabels);
  // 부모페이지에서 전달 받은 파라미터
  let { page, selData } = $props();
  let ctx, chartx, chartCanvas;
  let setConfig = false;

  let config = {
    type: "bar",
    data: {
      datasets: [
        {
          label: $t.stacked.label1, // 첫 번째 데이터셋
          // backgroundColor: ['#5156be'],  // 색상
          backgroundColor: ["#4427ee"], // 색상
          // borderWidth: 1,
          borderRadius: 10,
        },
        {
          label: $t.stacked.label2, // 두 번째 데이터셋
          // data: [7, 11, 5, 8, 3],
          backgroundColor: ["#ff6384"],
          // borderColor: 'rgba(54, 162, 235, 1)',
          // borderWidth: 1,
          borderRadius: 10,
        },
      ],
    },
    options: {
      interaction: {
      mode: "index" ,
      intersect: false,
    },
      scales: {
        x: {
          // stacked: true  // x축에 대해 스택되도록 설정
          ticks: {
            color: "white", // X축 레이블 글씨 색상 설정
          },
          grid: {
            display: true, // 그리드 표시 여부
            color: "gray", // 그리드 색상
          },
        },
        y: {
          // stacked: true  // y축에 대해 스택되도록 설정
          ticks: {
            color: "white", // X축 레이블 글씨 색상 설정
          },
          grid: {
            display: true, // 그리드 표시 여부
            color: "gray", // 그리드 색상
          },
        },
      },
      plugins: {
        datalabels: {
          color: ["white"], // 텍스트 색상
          // color: 'white', // 텍스트 색상
          font: { size: 18 },
          // formatter: function(v, ctx) {return v.toLocaleString() }
          formatter: function (v, ctx) {
            let num = parseFloat(v); // 안전하게 숫자로 변환
            if (!isNaN(num) && num !== 0) {
              return num.toLocaleString(); // 숫자인 경우, 천 단위 콤마 추가
            }
            return "";
          },
        },
        title: {
          display: true,
          text: "",
          font: { size: 20, weight: "normal" },
          color: "#fef9c3",
        },
        legend: {
          display: true, // 범례 표시 여부
          labels: { color: "#fff" },
          boxWidth: 14,
        },
      },
    },
  };

  export async function parentCall() {
    const rdata = await getData();
    chartDraw(rdata);
  }
  async function getData() {
    let service = "";
    if (page === "P")
      service = "/performcomposit/perfcomp_list?tid=" + selData.tid;
    else if (page === "T")
      service = "/testcomposit/testcomp_list?tid=" + selData.tid;
    const res = await fetch($rooturl + service);
    if (res.ok) return await res.json();
    else throw new Error(res.statusText);
  }

  function setChartConfig(rdata) {
    if (setConfig) return;
    if (page === "P") {
      //성능
      config.data.datasets[1].label = $t.stacked.label3;
      if (config.data.datasets.length == 2) {
        config.data.datasets.push({
          // label: '지연',  // 두 번째 데이터셋
          label: $t.stacked.label4, // 두 번째 데이터셋
          backgroundColor: ["#b604ce"],
          // borderWidth: 1,
          borderRadius: 10,
        });
        config.data.datasets.push({
          label: $t.stacked.label6, // 두 번째 데이터셋
          backgroundColor: ["#3cba9f"],
          // borderWidth: 1,
          borderRadius: 10,
        });
      }
    } else if (page === "T") {
      //테스트
      config.data.datasets[1].label = $t.stacked.label5;
      if (config.data.datasets.length == 2) {
        config.data.datasets.push({
          label: $t.stacked.label7, // 두 번째 데이터셋
          backgroundColor: ["#b604ce"],
          // borderWidth: 1,
          borderRadius: 10,
        });
        config.data.datasets.push({
          label: $t.stacked.label6, // 두 번째 데이터셋
          backgroundColor: ["#3cba9f"],
          // borderWidth: 1,
          borderRadius: 10,
        });
      }
    }
    config.options.scales.x.stacked = true;
    config.options.scales.y.stacked = true;
    config.data.datasets[0].stack = "group1";
    config.data.datasets[1].stack = "group2";
    config.data.datasets[2].stack = "group2";
    config.data.datasets[3].stack = "group2";
    config.data.datasets[2].color = "black";
    config.options.plugins.title.text = $t.stacked.title1;
    setConfig = true;
  }
  function chartDraw(rdata) {
    setChartConfig(rdata);
    let apnms = [];
    let tcnts = [];
    let scnts = [];
    let delays = [];
    let nocnts = [];
    let totCnt = 0;

    rdata.forEach((element) => {
      apnms.push(element.apnm);
      tcnts.push(element.tcnt);
      totCnt += element.tcnt;
      scnts.push(element.scnt);
      if (page === "P") delays.push(element.delay);
      else if (page === "T") delays.push(element.fcnt);
      nocnts.push(element.nocnt);
    });
    config.data.labels = apnms;
    config.data.datasets[0].data = tcnts;
    config.data.datasets[1].data = scnts;
    config.data.datasets[2].data = delays;
    config.data.datasets[3].data = nocnts;
    chartx.update();
  }


  onMount(async () => {
    ctx = chartCanvas.getContext("2d");
    chartx = new Chart(ctx, config);
    await parentCall();
  });

  // const interval = setInterval(parentCall, $intlMs);
  // onDestroy(() => clearInterval(interval));
</script>

<canvas bind:this={chartCanvas} id="myChart" class="flex"></canvas>
