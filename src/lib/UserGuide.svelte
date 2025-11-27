
<script>
  import DashBoard  from "./DashBoard.svelte";
  import LoadDataVerifyResult from "./LoadDataVerifyResult.svelte";
  import LoadDataVerifyResultPage from "./LoadDataVerifyResultPage.svelte";
  import { onMount } from "svelte";

  
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
   // 버튼 클릭 핸들러
// async function downloadFile(): Promise<void> {//서버 연결 시 
  async function downloadFile() {
  try {
    // 파일 URL (서버에서 제공하는 파일 경로)
    const fileUrl = "/api/files/사용자가이드.pdf";

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
          ?.replace(/['"]/g, "") || "사용자 가이드.pdf"
      : "사용자 가이드.pdf";

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
button {
  cursor: pointer;
  transition: background-color 0.3s ease;
}

</style>
   <div class="flex-col bg-gray-700 rounded-lg ">
      <!-- <div class="flex w-full  items-center mt-28">
      </div> -->
      <div class="flex-col rounded-lg br1gray" style="height: 150px;">
        <!-- <div class="flex w-full">
          <h1 class="text-1xl font-bold tracking-tight text-white pt-3 pl-3 pr-3">2차 테스트 결과</h1>
        </div> -->
        <div class="flex justify-between w-full  p-3">
        
          
            <div class="fle width-39">
           
              <label for="date-from" class="text-sm font-medium text-white  font-bold whitespace-nowrap" style="font-size: 25px;">
                  
                  1. 로그인 한다. <br>
                  2. 로그인 한 다음 나오는 페이지는 모니터링 화면<br>
              </label>
              <button on:click={downloadFile} class="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded">
                사용자 가이드 다운로드
              </button>
            </div>
          
      </div>
    </div>
    
    
      
    
</div>

