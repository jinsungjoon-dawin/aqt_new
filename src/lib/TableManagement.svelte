<script lang="ts">
  import { onMount } from 'svelte';
  import { rooturl } from '../aqtstore';
  // 상태 변수
  let tables: string[] = [];
  let selectedTable: string | null = null;
  let isLoading = false;
  let error: string | null = null;

  // 테이블 관리 폼 데이터
  let manageMode: 'create' | 'edit' = 'create';
  let formTableName = '';
  let formTableDescription = '';
  let formColumns = [
    { name: 'id', type: 'INT', length: 11, isNull: false, isPk: true, autoIncrement: true },
    { name: '', type: 'VARCHAR', length: 255, isNull: true, isPk: false, autoIncrement: false }
  ];

  // 컬럼 추가 관련 변수
  let addColumnInfo = { name: '', type: 'VARCHAR', length: 255, isNull: true };

  // 라이프사이클 함수: 컴포넌트 마운트 시 테이블 목록 가져오기
  onMount(fetchTables);

  // API 호출: 모든 테이블 목록 가져오기
  async function fetchTables() {
    isLoading = true;
    error = null;
    try {
      const res = await fetch(`${$rooturl}/tables`);
      if (!res.ok) throw new Error('테이블 목록을 불러오는 데 실패했습니다.');
      tables = await res.json();
    } catch (e: any) {
      error = e.message;
    } finally {
      isLoading = false;
    }
  }

  // API 호출: 특정 테이블의 구조(스키마) 가져오기
  async function fetchTableSchema(tableName: string) {
    selectedTable = tableName;
    manageMode = 'edit';
    isLoading = true;
    error = null;
    try {
      // Promise.all로 테이블 구조와 관리 정보를 동시에 가져옵니다.
      const [schemaRes, infoRes] = await Promise.all([fetch(`${$rooturl}/tables/${tableName}`), fetch(`${$rooturl}/tables/info/${tableName}`)]);
      if (!schemaRes.ok) throw new Error(`'${tableName}' 테이블의 구조를 불러오는 데 실패했습니다.`);
      if (!infoRes.ok) throw new Error(`'${tableName}' 테이블의 관리 정보를 불러오는 데 실패했습니다.`);

      const schemaData = await schemaRes.json();
      const infoData = await infoRes.json();

      formTableName = tableName;
      formTableDescription = infoData.table_description || '';
      formColumns = schemaData.map(col => ({ name: col.Field, type: col.Type.replace(/\(\d+\)/, '').toUpperCase(), length: parseInt(col.Type.match(/\((\d+)\)/)?.[1] || '0'), isNull: col.Null === 'YES', isPk: col.Key === 'PRI', autoIncrement: col.Extra.includes('auto_increment') }));
    } catch (e: any) {
      error = e.message;
    } finally {
      isLoading = false;
    }
  }

  // UI 이벤트: 새 컬럼 추가 (테이블 생성 폼)
  function addColumnField() {
    formColumns = [...formColumns, { name: '', type: 'VARCHAR', length: 255, isNull: true, isPk: false, autoIncrement: false }];
  }

  // UI 이벤트: 컬럼 삭제 (테이블 생성 폼)
  function removeColumnField(index: number) {
    formColumns = formColumns.filter((_, i) => i !== index);
  }

  // UI 이벤트: 새 테이블 생성 모드로 전환
  function switchToCreateMode() {
    selectedTable = null;
    manageMode = 'create';
    formTableName = '';
    formTableDescription = '';
    formColumns = [
      { name: 'id', type: 'INT', length: 11, isNull: false, isPk: true, autoIncrement: true },
      { name: '', type: 'VARCHAR', length: 255, isNull: true, isPk: false, autoIncrement: false }
    ];
  }

  // API 호출: 새 테이블 생성
  async function handleCreateTable() {
    if (!formTableName.trim()) return alert('테이블 이름을 입력하세요.');
    if (!formTableDescription.trim()) return alert('테이블 설명을 입력하세요.');
    if (formColumns.some(c => !c.name.trim())) return alert('모든 컬럼의 이름을 입력하세요.');

    try {
      const res = await fetch(`${$rooturl}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName: formTableName, description: formTableDescription, columns: formColumns })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '테이블 생성에 실패했습니다.');
      
      alert(`테이블 '${formTableName}'이(가) 성공적으로 생성되었습니다.`);
      await fetchTables(); // 테이블 목록 새로고침
      selectedTable = formTableName; // 새로 생성된 테이블 선택
      await fetchTableSchema(formTableName);


    } catch (e: any) {
      alert(e.message);
    }
  }

  // API 호출: 기존 테이블에 컬럼 추가 (테이블 수정)
  async function handleAddColumn() {
    if (!selectedTable) return;
    if (!addColumnInfo.name.trim()) return alert('추가할 컬럼의 이름을 입력하세요.');

    try {
      const res = await fetch(`${$rooturl}/tables/${selectedTable}/columns`, { // API 경로 수정
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addColumnInfo)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '컬럼 추가에 실패했습니다.');

      alert(`'${selectedTable}' 테이블에 '${addColumnInfo.name}' 컬럼이 추가되었습니다.`);
      await fetchTableSchema(selectedTable); // 스키마 새로고침
      addColumnInfo = { name: '', type: 'VARCHAR', length: 255, isNull: true }; // 폼 초기화

    } catch (e: any) {
      alert(e.message);
    }
  }

  // API 호출: 테이블 설명 수정
  async function handleUpdateDescription() {
    if (!selectedTable) return;
    if (!formTableDescription.trim()) return alert('테이블 설명을 입력하세요.');

    try {
      const res = await fetch(`${$rooturl}/tables/info/${selectedTable}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: formTableDescription })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '테이블 설명 수정에 실패했습니다.');

      alert('테이블 설명이 성공적으로 수정되었습니다.');

    } catch (e: any) {
      alert(e.message);
    }
  }

  // API 호출: 테이블 삭제
  async function handleDeleteTable() {
    if (!selectedTable) return;

    // 사용자에게 위험한 작업임을 알리고 재확인 받습니다.
    if (!confirm(`정말로 '${selectedTable}' 테이블을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const res = await fetch(`${$rooturl}/tables/${selectedTable}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '테이블 삭제에 실패했습니다.');

      alert(result.message);
      await fetchTables(); // 테이블 목록 새로고침
      switchToCreateMode(); // 생성 모드로 전환
    } catch (e: any) {
      alert(e.message);
    }
  }

</script>

<div class="container mx-auto p-8 font-sans bg-gray-50 min-h-screen">
  <header class="mb-8">
    <h1 class="text-4xl font-bold text-gray-800">MariaDB 테이블 관리</h1>
    <p class="text-gray-600">데이터베이스 테이블을 생성하고 수정합니다.</p>
  </header>

  {#if error}
    <div class="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
      <span class="font-medium">오류 발생!</span> {error}
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <!-- 왼쪽: 테이블 목록 -->
    <aside class="md:col-span-1 bg-white p-6 rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-semibold">관리 테이블</h2>
        <button on:click={switchToCreateMode} class="btn-secondary text-sm">새 테이블</button>
      </div>
      {#if isLoading && tables.length === 0}
        <p>로딩 중...</p>
      {:else if tables.length === 0}
        <p>테이블이 없습니다.</p>
      {:else}
        <ul class="space-y-2">
          {#each tables as table}
            <li>
              <button on:click={() => fetchTableSchema(table.table_name)} class="w-full text-left px-4 py-2 rounded transition-colors text-gray-700"
                class:bg-blue-500={selectedTable === table.table_name}
                class:text-white={selectedTable === table.table_name}
                class:hover:bg-gray-100={selectedTable !== table.table_name}>
                {table.table_name}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </aside>

    <!-- 오른쪽: 메인 컨텐츠 -->
    <section class="md:col-span-2 space-y-8">
      <!-- 테이블 관리 폼 (생성/수정 통합) -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-2xl font-semibold mb-4">
          {#if manageMode === 'create'}새 테이블 생성{:else}'{selectedTable}' 테이블 정보{/if}
        </h2>
        <form on:submit|preventDefault class="space-y-4">
          <div>
            <label for="tableName" class="label">테이블 이름</label>
            <input type="text" id="tableName" bind:value={formTableName} class="input w-full" placeholder="new_table" readonly={manageMode === 'edit'}>
          </div>
          <div>
            <label for="tableDesc" class="label">테이블 설명</label>
            <textarea id="tableDesc" bind:value={formTableDescription} class="input w-full" rows="2" placeholder="이 테이블의 용도나 특징을 입력하세요."></textarea>
          </div>
          <div class="space-y-3">
            <h3 class="text-lg font-medium text-gray-800">컬럼 정의</h3>
            {#each formColumns as col, i}
              <div class="grid grid-cols-12 gap-2 items-center p-2 border rounded-md bg-gray-50">
                <input type="text" bind:value={col.name} placeholder="컬럼명" class="input col-span-3" readonly={manageMode === 'edit'}>
                <select bind:value={col.type} class="input col-span-2" disabled={manageMode === 'edit'}>
                  <option>INT</option><option>VARCHAR</option><option>TEXT</option><option>DATE</option><option>DATETIME</option>
                </select>
                <input type="number" bind:value={col.length} placeholder="길이" class="input col-span-1" readonly={manageMode === 'edit'}>
                <label class="col-span-2 flex items-center space-x-2 justify-center text-sm"><input type="checkbox" bind:checked={col.isNull} class="form-checkbox" disabled={manageMode === 'edit'}><span>Null</span></label>
                <label class="col-span-1 flex items-center space-x-2 justify-center text-sm"><input type="checkbox" bind:checked={col.isPk} class="form-checkbox" disabled={manageMode === 'edit'}><span>PK</span></label>
                <label class="col-span-1 flex items-center space-x-2 justify-center text-sm"><input type="checkbox" bind:checked={col.autoIncrement} class="form-checkbox" disabled={manageMode === 'edit'}><span>AI</span></label>
                {#if manageMode === 'create' && i > 0}
                  <button type="button" on:click={() => removeColumnField(i)} class="btn-danger col-span-2">삭제</button>
                {:else}
                  <div class="col-span-2"></div>
                {/if}
              </div>
            {/each}
          </div>
          <div class="flex justify-between items-end pt-4 border-t">
            {#if manageMode === 'create'}
              <button type="button" on:click={addColumnField} class="btn-secondary">컬럼 필드 추가</button>
              <button type="button" on:click={handleCreateTable} class="btn-primary font-semibold">테이블 생성</button>
            {:else}
              <!-- 수정 모드 버튼들 -->
              <button type="button" on:click={handleDeleteTable} class="btn-danger font-semibold">테이블 삭제</button>
              <button type="button" on:click={handleUpdateDescription} class="btn-primary font-semibold">설명만 저장</button>
            {/if}
          </div>
        </form>

        <!-- 컬럼 추가 폼 (수정 모드에서만 보임) -->
        {#if manageMode === 'edit'}
        <div class="mt-6 border-t pt-6">
          <h3 class="text-xl font-semibold mb-3">컬럼 추가 (ALTER TABLE)</h3>
          <form on:submit|preventDefault={handleAddColumn} class="grid grid-cols-10 gap-3 items-end">
            <div class="col-span-3"><label class="label">컬럼명</label><input type="text" bind:value={addColumnInfo.name} placeholder="new_column" class="input"></div>
            <div class="col-span-2"><label class="label">타입</label><select bind:value={addColumnInfo.type} class="input"><option>VARCHAR</option><option>INT</option><option>TEXT</option><option>DATE</option><option>DATETIME</option></select></div>
            <div class="col-span-2"><label class="label">길이</label><input type="number" bind:value={addColumnInfo.length} placeholder="255" class="input"></div>
            <div class="col-span-1 flex items-center pb-2"><input type="checkbox" bind:checked={addColumnInfo.isNull} class="h-4 w-4 mr-2"><span class="text-sm">NULL</span></div>
            <div class="col-span-2"><button type="submit" class="btn-primary w-full">컬럼 추가</button></div>
          </form>
        </div>
        {/if}
      </div>
    </section>
  </div>
</div>

<style lang="postcss">
  .th { @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider; }
  .td { @apply px-6 py-4 whitespace-nowrap text-sm text-gray-500; }
  .label { @apply block text-sm font-medium text-gray-700 mb-1; }
  .input { @apply mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm; }
  .form-checkbox { @apply h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500; }
  .btn-primary { @apply px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500; }
  .btn-secondary { @apply px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500; }
  .btn-danger { @apply px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500; }
</style>