
<script>
  import DashBoard  from "./DashBoard.svelte";
  import LoadDataVerifyResult from "./LoadDataVerifyResult.svelte";
  import LoadDataVerifyResultPage from "./LoadDataVerifyResultPage.svelte";
  import { onMount } from "svelte";
  import Tab1 from "./UserGuide.svelte";
  import Tab2 from "./InforMation.svelte";
  import Tabs from "./Tabs.svelte";
  
  let pageNm = "사용자 가이드";

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
 // List of tab items with labels, values and assigned components
let items = [
  { label: "사용자 가이드",
  value: 1,
  component: Tab1,
      class:"tablabel"
  },
  { label: "정보",
  value: 2,
  component: Tab2
}
  // { label: "Tab 3",
  //  value: 3,
  //  component: Tab3
  // }
];        
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
<div>
<Tabs {items} />
</div>
