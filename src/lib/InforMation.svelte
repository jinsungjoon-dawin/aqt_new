
<script>
    import DashBoard  from "./DashBoard.svelte";
    import LoadDataVerifyResult from "./LoadDataVerifyResult.svelte";
    import LoadDataVerifyResultPage from "./LoadDataVerifyResultPage.svelte";
    import { onMount } from "svelte";

    
    let pageNm = "정보";
  
    let cnm = DashBoard ;
  
      export let tcode ;
      let conds = {
        tcode: "",
        rcode: '',
        page: 0,
        psize: 20,
        cond: "",
        uri: "",
        task:""
      };
      /*
      let sv_row;
      let promise = Promise.resolve([]);
      async function getdata() {
          const res = await fetch( "/dashboard/list/"+$authApps);
          promise = await res.json();
    //      console.log(" call dashboard end", promise) ;
      }
    */
    let list = [];

  async function getData() {
    const res = await fetch("/performComposit" );
    if (res.ok)
      return await res.json();
    else
      throw new Error(res.statusText);
  }
  
  
  onMount(async () => {
    list = await getData() ;
    list = list.data;
  });
   
      
</script>   
<style>
    .tcode-status {
    font-family: Arial, Helvetica, sans-serif;
    border-collapse: collapse;
    width: 100%;
    overflow-y: auto;
    border: 1px solid black;
    }
    .table-title {
    background-color: #a9c8ff;
    border-bottom-style: solid;
    }

    html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    overflow: hidden; /* 스크롤 제거 */
  }
  .width-29 { width: 29%;}
  .width-49 { width: 49%;}
  .width-35 { width: 35%;}
  .width-69 { width: 69%;}
  .width-85 { width: 85%;}
  .bb1gray{ border-bottom: 1px solid gray;}
  .bl1gray{ border-left: 1px solid gray;}
  .br1gray{ border-right: 1px solid gray;}
  .bt1gray{ border-top: 1px solid gray;}

  
</style>
    <div class="flex-col bg-gray-700 rounded-lg ">
        <div class="flex-col rounded-lg br1gray" style="height: 150px;">
          <div class="flex justify-between w-full  p-3">
            <div class="fle width-39">             
                <label for="date-from" class="text-sm font-medium text-white  font-bold whitespace-nowrap" style="font-size: 25px;">    
                    1. 다윈아이씨티에서 AQT를 제공 해준다. <br>
                    2. 프로젝트 기간에만 제공하고 철수 시 따고 제공 하지는 않는다<br>
                </label>
            </div>
        </div> 
    </div>
</div>

