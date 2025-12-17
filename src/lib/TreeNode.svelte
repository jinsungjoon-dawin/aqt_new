<script>
    export let tree;
    export let label = "";
    export let expand = false;

    let isOpen = expand;

    function toggle() {
        if (isObject) {
            isOpen = !isOpen;
        }
    }

    $: isObject = tree !== null && typeof tree === "object";
    $: isArray = Array.isArray(tree);
    $: type = isArray ? "array" : typeof tree;
    $: itemCount = isObject ? Object.keys(tree).length : 0;
</script>

<div class="tree-node pl-4 border-l border-gray-200">
    <div
        class="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
        on:click|stopPropagation={toggle}
    >
        {#if isObject}
            <span class="text-gray-500 text-xs w-4">
                {#if isOpen}▼{:else}▶{/if}
            </span>
        {:else}
            <span class="w-4"></span>
        {/if}

        <span class="font-bold text-blue-700">{label}</span>

        {#if isObject}
            <span class="text-gray-400 text-xs">
                {isArray ? `[${itemCount}]` : `{${itemCount}}`}
            </span>
        {:else}
            <span class="text-gray-600">=</span>
            <span class="text-green-700 whitespace-pre-wrap break-all"
                >{tree}</span
            >
        {/if}
    </div>

    {#if isObject && isOpen}
        <div class="children">
            {#each Object.entries(tree) as [key, value]}
                <svelte:self tree={value} label={key} />
            {/each}
        </div>
    {/if}
</div>

<style>
    .tree-node .children {
        transition: all 0.2s ease-in-out;
    }
</style>
