<script lang="ts">
  import Login from "./lib/Login.svelte";
  import Company from "./lib/Company.svelte";
  import CommonManage from "./lib/CommonManage.svelte";
  import CommonDataManage from "./lib/CommonDataManage.svelte";
  import JobManage from "./lib/JobManage.svelte";
  import JobDataManage from "./lib/JobDataManage.svelte";
  import Job from "./lib/Job.svelte";
  import Project from "./lib/Project.svelte";
  // @ts-ignore
  import CommHeader from "./lib/CommHeader.svelte";
  // @ts-ignore
  import CommHeaderData from "./lib/CommHeaderData.svelte";
  import JobDataTree from "./lib/JobDataTree.svelte";
  import Sample from "./lib/Sample.svelte";
  import Test from "./lib/Test.svelte";
  import Tree from "./lib/Tree.svelte";
  import TreeCRUD from "./lib/TreeCRUD.svelte";

  import { isLogged, userid, t } from "./aqtstore";
  import { onMount } from "svelte";
  // @ts-ignore
  let cnm = Project;
  let pageNm = "프로젝트 업무 정보";
  let menuIdx = 0;
  let today = "";

  let menus = [
    {
      pageNm: "기초정보",
      subMenus: [
        { pageNm: "프로젝트 업무 정보", cnm: Project },
        { pageNm: "CommHeader 등록", cnm: CommHeader },
        { pageNm: "CommHeader자료등록", cnm: CommHeaderData },
        { pageNm: "업무 관리", cnm: JobManage },
        { pageNm: "업무 데이터 관리", cnm: JobDataManage },
        { pageNm: "업무 데이터 트리", cnm: JobDataTree },
      ],
    },
    {
      pageNm: "샘플",
      subMenus: [
        { pageNm: "고객사 관리", cnm: Company },
        { pageNm: "공통항목 관리", cnm: CommonManage },
        { pageNm: "공통항목 데이터 관리", cnm: CommonDataManage },
        { pageNm: "Job Config", cnm: Job },
      ],
    },
  ];

  function getToDate() {
    var today = new Date();

    var year = today.getFullYear();
    var month = ("0" + (today.getMonth() + 1)).slice(-2);
    var day = ("0" + today.getDate()).slice(-2);

    return year + "-" + month + "-" + day;
  }
  onMount(async () => {
    today = getToDate();
  });
</script>

<!-- {#if !$isLogged} -->
{#if !$isLogged}
  <Login></Login>
{:else}
  <div class="min-h-full">
    <nav class="bg-gray-800 bb1gray">
      <!-- <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"> -->
      <div class="mx-auto w-10/12 px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center">
            <div
              class="shrink-0 text-white font-bold text-2xl italic font-serif"
            >
              <!-- <img src="/src/img/top2.png" class="object-contain"> -->
              AQT
            </div>
            <div class="hidden md:block">
              <ul class="ml-10 flex items-baseline space-x-4">
                {#each menus as item, idx}
                  <li class="py-1">
                    {#if item.subMenus}
                      <div
                        class="group relative dropdown px-4 rounded-md px-3 py-2 text-sm font-medium text-gray-300"
                      >
                        <a
                          class="rounded-md px-3 py-2 text-sm font-medium {idx ===
                          menuIdx
                            ? 'text-white bg-gray-900'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
                          href="#">{item.pageNm}</a
                        >
                        <div
                          class="group-hover:block dropdown-menu absolute hidden h-auto z-50"
                        >
                          <ul class="top-0 w-48 bg-gray-900 shadow px-6 py-1">
                            {#each item.subMenus as subItem}
                              <li class="py-1">
                                <a
                                  href="#"
                                  class="menu-item block text-gray-300 hover:text-white"
                                  on:click|preventDefault={(_) => {
                                    cnm = subItem.cnm;
                                    pageNm = subItem.pageNm;
                                    menuIdx = idx;
                                  }}>{subItem.pageNm}</a
                                >
                              </li>
                            {/each}
                          </ul>
                        </div>
                      </div>
                    {:else}
                      <a
                        href="#"
                        class="rounded-md px-3 py-2 text-sm font-medium {idx ===
                        menuIdx
                          ? 'text-white bg-gray-900'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'}"
                        on:click|preventDefault={(_) => {
                          cnm = item.cnm;
                          pageNm = item.pageNm;
                          menuIdx = idx;
                        }}>{item.pageNm}</a
                      >
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          </div>
          <span class="text-yellow-100 text-lg">{$t.com.nowDate} {today}</span>
        </div>
      </div>
    </nav>
    <main class="bg-gray-800">
      <svelte:component this={cnm} />
    </main>
  </div>
{/if}

<style lang="postcss">
  :global(html) {
    background-color: theme(colors.gray.100);
  }
  .bb1gray {
    border-bottom: 1px solid gray;
  }
</style>
