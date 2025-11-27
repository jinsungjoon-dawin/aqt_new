<script lang="ts">
  import { rooturl } from '../aqtstore';
  import { onMount } from 'svelte';

  // SSH 연결 및 명령어 실행을 위한 상태 변수들
  let host = 'localhost'; // 호스트 주소
  let port = 22; // 포트 번호
  let username = 'test'; // 사용자 이름
  let password = '1234'; // 비밀번호
  let command = 'ls -la'; // 실행할 명령어
  let output = ''; // 명령어 실행 결과
  let isLoading = false; // 로딩 상태
  let isConnected = false; // 연결 상태
  let currentWorkingDirectory = ''; // 현재 작업 디렉토리

  // 마지막 명령어 저장을 위한 상태 변수들
  let lastCommand = ''; // 마지막으로 실행한 명령어
  let lastOutput = ''; // 마지막 명령어의 출력
  let lastExitCode = null; // 마지막 명령어의 종료 코드
  let showSaveButton = false; // 저장 버튼 표시 여부
  let activeTab = 'terminal'; // 'terminal' or 'fileCollector'
  let programArgInput = `/home/test/asw_hsm_aml_src_list "/home/test/20251116/ -type f -name '*.txt'" CRC FIND test_list`; // 기존 명령어
  // 15개의 필드를 출력하는 테스트용 echo 명령어
  //let programArgInput = `echo "/tmp/testfile.c F 20251030143749 1234 test 1000 test 1000 644 987654321 extra1 extra2 extra3 extra4 extra5"`;

  let jobIdInput = ''; // For user-entered job ID
  let jobDescriptionInput = ''; // For user-entered job description
  let tableInfos = []; // To store table info from the backend
  let selectedTable = ''; // To store the selected table name

  // 컴포넌트 마운트 시 테이블 목록을 가져옵니다.
  onMount(async () => {
    try {
      const response = await fetch(`${$rooturl}/tables`);
      if (!response.ok) throw new Error('테이블 목록을 불러오는데 실패했습니다.');
      tableInfos = await response.json();
    } catch (error) {
      console.error(error.message);
    }
  });

  // 원격으로 명령어를 실행하는 내부 함수
  async function _executeRemoteCommand(commandToExecute) {
    const response = await fetch(`${$rooturl}/execute-command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port, username, password, command: commandToExecute }),
    });
    return response;
  }

  // 현재 작업 디렉토리(CWD)를 초기화하는 함수
  async function initializeCwd() {
    try {
      const response = await _executeRemoteCommand('pwd'); // 'pwd' 명령어 실행
      const data = await response.json();
      if (response.ok) {
        currentWorkingDirectory = data.output.trim(); // 응답에서 공백 제거 후 CWD 설정
        output = `연결되었습니다. 현재 디렉토리: ${currentWorkingDirectory}`;
      } else {
        output = `초기 디렉토리 가져오기 오류: ${data.error}`; // 오류 처리
        isConnected = false;
      }
    } catch (error) {
      output = `네트워크 오류: ${error.message}`; // 네트워크 오류 처리
      isConnected = false;
    }
  }

  // SSH 연결을 수립하는 함수
  async function connect() {
    isLoading = true;
    output = '';
    showSaveButton = false;
    try {
      // 연결 테스트를 위해 간단한 echo 명령어 전송
      const response = await _executeRemoteCommand("echo 'Connection established'");
      const data = await response.json();

      if (response.ok) {
        isConnected = true;
        await initializeCwd(); // 연결 성공 시 CWD 초기화
      } else {
        output = `오류: ${data.error}`; // 오류 처리
        isConnected = false;
      }
    } catch (error) {
      output = `네트워크 오류: ${error.message}`; // 네트워크 오류 처리
      isConnected = false;
    } finally {
      isLoading = false;
    }
  }

  // SSH 연결을 끊는 함수
  async function disconnect() {
    isLoading = true;
    output = '';
    showSaveButton = false;
    try {
      const response = await fetch(`${$rooturl}/execute-command/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, username }),
      });
      const data = await response.json();
      if (response.ok) {
        output = data.message;
        isConnected = false;
        currentWorkingDirectory = ''; // CWD 초기화
      } else {
        output = `오류: ${data.error}`; // 오류 처리
      }
    } catch (error) {
      output = `네트워크 오류: ${error.message}`; // 네트워크 오류 처리
    } finally {
      isLoading = false;
    }
  }

  // 명령어를 실행하는 함수
  async function executeCommand() {
    isLoading = true;
    output = '';
    showSaveButton = false;
    const userCommand = command.trim(); // 사용자 입력 명령어 공백 제거
    let commandToSend;
    const isCdCommand = userCommand.startsWith('cd '); // 'cd' 명령어인지 확인

    // 'cd' 명령어인 경우, 현재 디렉토리에서 실행 후 'pwd'로 경로를 다시 가져옴
    if (isCdCommand) {
      commandToSend = `cd ${currentWorkingDirectory} && ${userCommand} && pwd`;
    } else {
      // 그 외 명령어는 현재 디렉토리에서 실행
      commandToSend = `cd ${currentWorkingDirectory} && ${userCommand}`;
    }

    try {
      const response = await _executeRemoteCommand(commandToSend);
      const data = await response.json();

      if (response.ok) {
        showSaveButton = true; // 명령어 실행 후 저장 버튼 표시
        lastCommand = userCommand;
        lastExitCode = data.code;

        if (isCdCommand) {
          // cd 명령어 성공 시(data.code === 0)에만 CWD 업데이트
          if (data.code === 0) {
            currentWorkingDirectory = data.output.trim(); // 'cd' 후 CWD 업데이트
            output = ``; // 'cd'는 별도 출력 없음
            lastOutput = '';
          } else {
            // cd 명령어 실패 시
            output = data.error || `명령어 실행 오류: ${userCommand}`; // stderr 또는 일반 오류 메시지
            lastOutput = data.error;
          }
        } else {
          output = data.output;
          lastOutput = data.output;
        }
      } else {
        output = `오류: ${data.error}`; // 오류 처리
      }
    } catch (error) {
      output = `네트워크 오류: ${error.message}`; // 네트워크 오류 처리
      isConnected = false;
    } finally {
      isLoading = false;
    }
  }

  // 명령어 실행 기록을 저장하는 함수
  async function saveHistory() {
    if (!showSaveButton) return;

    const payload = {
      userId: username,
      targetHost: host,
      targetPort: port,
      command: lastCommand,
      output: lastOutput,
      exitCode: lastExitCode,
    };

    try {
      const response = await fetch(`${$rooturl}/execute-command/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        alert('성공적으로 저장되었습니다.');
      } else {
        alert(`저장 실패: ${result.message}`);
      }
    } catch (error) {
      alert(`저장 중 네트워크 오류 발생: ${error.message}`);
    }
  }

  // 파일 정보를 저장하는 함수
  async function saveFileInfo() {
    if (!jobIdInput.trim()) {
      alert('Job ID는 필수 입력 항목입니다.');
      return;
    }
    if (!programArgInput.trim()) {
      alert('Program Arguments는 필수 입력 항목입니다.');
      return;
    }
    if (!selectedTable) {
      alert('저장할 테이블을 선택해주세요.');
      return;
    }

    isLoading = true;
    output = '';
    try {
      const response = await fetch(`${$rooturl}/execute-command/save-file-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port,
          username,
          password,
          jobId: jobIdInput,
          jobDescription: jobDescriptionInput, // Pass jobDescription
          programArg: programArgInput,
          tableSelect: selectedTable }), // Pass selected table name
      });

      const result = await response.json();
      if (response.ok) {
        console.log(response);
        alert('파일 정보가 성공적으로 저장되었습니다.');
        output = `${result.message}\n\n--- SCRIPT OUTPUT ---\n${result.output || '(No output)'}`;
      } else {
        alert(`파일 정보 저장 실패: ${result.error || result.message}`);
        output = `오류: ${result.message || result.error}\n\n--- SCRIPT OUTPUT ---\n${result.output || '(출력 없음)'}`;
      }
    } catch (error) {
      alert(`파일 정보 저장 중 네트워크 오류 발생: ${error.message}`);
      output = `네트워크 오류: ${error.message}`;
    } finally {
      isLoading = false;
    }
  }

</script>

<!-- UI 마크업 섹션 -->
<div class="container mx-auto p-4 lg:p-8 bg-gray-50 text-gray-800">
  <h2 class="text-2xl lg:text-3xl font-bold mb-6 text-gray-700">SSH 명령어 실행기</h2>

  <!-- Connection Form -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-6 bg-white rounded-lg shadow-md">
    <div class="form-group">
      <label for="host" class="block text-sm font-medium text-gray-600 mb-1">호스트</label>
      <input id="host" type="text" bind:value={host} disabled={isConnected} class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
    </div>
    <div class="form-group">
      <label for="port" class="block text-sm font-medium text-gray-600 mb-1">포트</label>
      <input id="port" type="number" bind:value={port} disabled={isConnected} class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
    </div>
    <div class="form-group">
      <label for="username" class="block text-sm font-medium text-gray-600 mb-1">사용자명</label>
      <input id="username" type="text" bind:value={username} disabled={isConnected} class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
    </div>
    <div class="form-group">
      <label for="password" class="block text-sm font-medium text-gray-600 mb-1">비밀번호</label>
      <input id="password" type="password" bind:value={password} disabled={isConnected} class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
    </div>

    <!-- Connect/Disconnect buttons are grouped with connection info -->
    <div class="md:col-span-2 lg:col-span-4 flex items-end">
      {#if !isConnected}
        <button on:click={connect} disabled={isLoading} class="w-full md:w-auto bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-md">
          {isLoading ? '연결 중...' : '연결'}
        </button>
      {:else}
        <button on:click={disconnect} disabled={isLoading} class="w-full md:w-auto bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors shadow-md">
          {isLoading ? '연결 해제 중...' : '연결 해제'}
        </button>
      {/if}
    </div>
  </div>

  {#if isConnected}
    <!-- Command Execution Form -->
    <div class="bg-white rounded-lg shadow-md mb-6">
      <!-- Tab Navigation -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-4" aria-label="Tabs">
          <button on:click={() => activeTab = 'terminal'} class="{activeTab === 'terminal' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm">
            대화형 터미널
          </button>
          <button on:click={() => activeTab = 'fileCollector'} class="{activeTab === 'fileCollector' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm">
            파일 정보 수집기
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Interactive Terminal Tab -->
        {#if activeTab === 'terminal'}
          <div class="form-group mb-4">
            <label for="command" class="block text-sm font-medium text-gray-600 mb-2">
              명령어 (현재 디렉토리: <span class="font-mono bg-gray-100 p-1 rounded">{currentWorkingDirectory}</span>)
            </label>
            <textarea id="command" bind:value={command} rows="4" class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm transition" placeholder="명령어 입력 (예: 'ls -l') 후 Enter 키를 누르세요" on:keydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); executeCommand(); } }}></textarea>
          </div>
          <div class="flex flex-wrap gap-4">
            <button on:click={executeCommand} disabled={isLoading} class="bg-indigo-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors shadow-md">
              {isLoading ? '실행 중...' : '명령어 실행'}
            </button>
            {#if showSaveButton}
              <button on:click={saveHistory} class="bg-green-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors shadow-md" disabled={isLoading}>
                결과 저장
              </button>
            {/if}
          </div>
        {/if}

        <!-- File Info Collector Tab -->
        {#if activeTab === 'fileCollector'}
          <div class="form-group mb-4">
            <label for="jobId" class="block text-sm font-medium text-gray-600 mb-1">Job ID (필수)</label>
            <input id="jobId" type="text" bind:value={jobIdInput} placeholder="고유한 Job ID를 입력하세요" class="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
          </div>
          <div class="form-group mb-4">
            <label for="jobDescription" class="block text-sm font-medium text-gray-600 mb-1">Job 설명</label>
            <textarea id="jobDescription" bind:value={jobDescriptionInput} placeholder="작업에 대한 설명을 입력하세요 (선택 사항)" rows="3" class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"></textarea>
          </div>
          <div class="form-group mb-4">
            <label for="tableSelect" class="block text-sm font-medium text-gray-600 mb-1">저장 테이블 선택 (필수)</label>
            <select id="tableSelect" bind:value={selectedTable} class="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="">-- 테이블 선택 --</option>
              {#each tableInfos as table}
                <option value={table.table_name}>{table.table_name +" "+ table.table_description}</option>
              {/each}
            </select>
          </div>
          <div class="form-group mb-4">
            <label for="programArg" class="block text-sm font-medium text-gray-600 mb-1">프로그램 인자</label>
            <input id="programArg" type="text" bind:value={programArgInput} class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
            <p class="text-xs text-gray-500 mt-1">명령어: <code class="font-mono bg-gray-200 p-1 rounded"> {programArgInput}</code></p>
          </div>
          <button on:click={saveFileInfo} class="bg-teal-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-teal-600 disabled:bg-gray-400 transition-colors shadow-md" disabled={isLoading}>
            파일 정보 저장
          </button>
        {/if}
      </div>
    </div>

    <!-- Output Container -->
    <div class="output-container mt-6">
      <h3 class="text-xl font-semibold mb-3 text-gray-700">출력</h3>
      <pre class="bg-gray-900 text-white p-4 rounded-lg shadow-inner whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">{output}</pre>
    </div>
  {/if}
</div>
