
<script>
import PieChart  from "./PieChart.svelte";
import LoadDataVerifyResult from "./LoadDataVerifyResult.svelte";


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
      const res = await fetch( "/PieChart/list/"+$authApps);
      promise = await res.json();
//      console.log(" call PieChart end", promise) ;
  }
*/

  
</script>

<div class="container" style="margin-top: 5px;">
  <label >스키마 검증 결과</label>
  <table class="tcode-status">
    <thead>
      <tr>
        <th>테스트ID</th>
        <th>테스트명</th>
        <th style="width:6em">테스트일자</th>
        <th>단계</th>
        <th>대상호스트</th>
        <th>서비스수</th>
        <th>패킷건수</th>
        <th>성공건수</th>
        <th>실패건수</th>
        <th>실패서비스</th>
        <th>성공율(%)</th>
        <th>미수행건수</th>
      </tr>
      
    </thead>
    <tbody>
            <tr>
            <td>test</td>
            <td align="left">1</td>
            <td>2</td>
            <td>3</td>
            <td>4</td>
            <td align="right">5</td>
            <td align="right">6</td>
            <td align="right">7</td>
            <td align="right">8</td>
            <td align="right">9</td>
            <td align="right">10</td>
            <td align="right">11</td>
          </tr>   
    </tbody>
    <tbody>
      <tr>
      <td>test</td>
      <td align="left">1</td>
      <td>2</td>
      <td>3</td>
      <td>4</td>
      <td align="right">5</td>
      <td align="right">6</td>
      <td align="right">7</td>
      <td align="right">8</td>
      <td align="right">9</td>
      <td align="right">10</td>
      <td align="right">11</td>
    </tr>   
</tbody>
<tbody>
  <tr>
  <td>test</td>
  <td align="left">1</td>
  <td>2</td>
  <td>3</td>
  <td>4</td>
  <td align="right">5</td>
  <td align="right">6</td>
  <td align="right">7</td>
  <td align="right">8</td>
  <td align="right">9</td>
  <td align="right">10</td>
  <td align="right">11</td>
</tr>   
</tbody>
  </table>
</div>




<div class="container" style="margin-top: 50px;">
  <label>Date 검증 결과</label>
  <table class="tcode-status">
    <thead>
      <tr>
        <th>구분</th>
        <th>DB계정명</th>
        <th></th>
        <th>테스트일자</th>
        <th>단계</th>
        <th>대상호스트</th>
        <th>서비스수</th>
        <th>패킷건수</th>
        <th>성공건수</th>
        <th>실패건수</th>
        <th>실패서비스</th>
        <th>성공율(%)</th>
        <th>미수행건수</th>
      </tr>
      
    </thead>
    <tbody>
            <tr>
            <td>test</td>
            <td align="left">1</td>
            <td>2</td>
            <td>3</td>
            <td>4</td>
            <td align="right">5</td>
            <td align="right">6</td>
            <td align="right">7</td>
            <td align="right">8</td>
            <td align="right">9</td>
            <td align="right">10</td>
            <td align="right">11</td>
          </tr>  
    </tbody>
    <tbody>
      <tr>
      <td>test</td>
      <td align="left">1</td>
      <td>2</td>
      <td>3</td>
      <td>4</td>
      <td align="right">5</td>
      <td align="right">6</td>
      <td align="right">7</td>
      <td align="right">8</td>
      <td align="right">9</td>
      <td align="right">10</td>
      <td align="right">11</td>
    </tr>  
    </tbody>
  </table>
</div>

<style>
  .tcode-status {
    font-family: Arial, Helvetica, sans-serif;
    border-collapse: collapse;
    width: 100%;
    overflow-y: auto;
    border: 1px solid black;
    
    
  }

  /*
  .tcode-status td,
  .tcode-status th {
    border: 1px solid rgb(214, 214, 230);
    padding: 5px;
  }

  .tcode-status th {
    text-align: center;
    position: sticky;
    top: 0;
  }

  .tcode-status tr:hover {
    background-color: #ddd;
  }
    */
</style>



