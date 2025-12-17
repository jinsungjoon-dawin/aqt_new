<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let k = null; // Key or Index in parent
    export let value; // The value itself
    export let isRoot = false;

    let isEditingKey = false;
    let newKey = k;

    // Expand state
    let isOpen = true;

    $: isObject = value !== null && typeof value === "object";
    $: isArray = Array.isArray(value);
    $: type = isArray ? "array" : value === null ? "null" : typeof value;
    $: itemCount = isObject ? Object.keys(value).length : 0;

    function toggle() {
        if (isObject) isOpen = !isOpen;
    }

    // DISPATCH ACTIONS TO PARENT
    function deleteNode() {
        if (isRoot) return;
        dispatch("delete", { k });
    }

    function startEditKey() {
        if (isRoot) return;
        isEditingKey = true;
        newKey = k;
    }

    function saveKey() {
        if (newKey !== k) {
            dispatch("rename", { oldKey: k, newKey });
        }
        isEditingKey = false;
    }

    // HANDLE ACTIONS FROM CHILDREN
    function handleChildDelete(childK) {
        if (isArray) {
            value.splice(childK, 1);
        } else {
            delete value[childK];
        }
        value = value; // Trigger reactivity
    }

    function handleChildRename(oldKey, newKey) {
        if (value.hasOwnProperty(newKey)) {
            alert("Key already exists");
            return;
        }
        const val = value[oldKey];
        delete value[oldKey];
        value[newKey] = val;
        value = value; // Trigger reactivity
    }

    // Add new child
    function addChild() {
        if (!isObject) return;
        if (isArray) {
            value.push("New Item");
            value = value;
        } else {
            const baseKey = "new_key";
            let uniqueKey = baseKey;
            let i = 1;
            while (value.hasOwnProperty(uniqueKey)) {
                uniqueKey = baseKey + "_" + i++;
            }
            value[uniqueKey] = "New Value";
            value = value;
        }
    }

    // Type conversion
    function changeType(e) {
        const newType = e.target.value;
        // Default values for new types
        if (newType === "string") value = "";
        else if (newType === "number") value = 0;
        else if (newType === "boolean") value = false;
        else if (newType === "object") value = {};
        else if (newType === "array") value = [];
        else if (newType === "null") value = null;

        // When type changes, we update 'value'.
        // Since 'value' is a prop bound from parent, updating it here propagates up if bind:value is used.
        // However, standard prop binding in Svelte works fine for value changes.
    }
</script>

<div class="tree-node pl-4 border-l border-gray-200 text-sm">
    <div
        class="flex items-center space-x-2 py-1 hover:bg-gray-100 rounded group"
    >
        <!-- Toggle / Icon -->
        <span
            class="cursor-pointer w-4 text-center"
            on:click|stopPropagation={toggle}
        >
            {#if isObject}
                <span class="text-gray-500 text-xs">{isOpen ? "▼" : "▶"}</span>
            {:else}
                <span class="text-gray-400">•</span>
            {/if}
        </span>

        <!-- KEY -->
        {#if !isRoot}
            {#if isEditingKey}
                <input
                    type="text"
                    bind:value={newKey}
                    class="border border-blue-400 px-1 py-0.5 rounded text-xs w-24"
                    on:blur={saveKey}
                    on:keydown={(e) => e.key === "Enter" && saveKey()}
                    autofocus
                />
            {:else}
                <span
                    class="font-bold text-blue-700 cursor-pointer"
                    on:dblclick={startEditKey}
                    title="Double click to rename key"
                >
                    {k}
                </span>
                <span class="text-gray-400 mx-1">:</span>
            {/if}
        {/if}

        <!-- VALUE -->
        <div class="flex-1 flex items-center space-x-2">
            {#if isObject}
                <span class="text-gray-400 text-xs italic">
                    {isArray ? `Array[${itemCount}]` : `Object{${itemCount}}`}
                </span>
            {:else if type === "string"}
                <input
                    type="text"
                    bind:value
                    class="border border-gray-300 px-1 py-0.5 rounded w-full focus:border-blue-500 outline-none"
                    placeholder="Empty string"
                />
            {:else if type === "number"}
                <input
                    type="number"
                    bind:value
                    class="border border-gray-300 px-1 py-0.5 rounded w-24 focus:border-blue-500 outline-none"
                />
            {:else if type === "boolean"}
                <input type="checkbox" bind:checked={value} />
            {:else if type === "null"}
                <span class="text-gray-400 italic">null</span>
            {/if}

            <!-- Type Selector (Hidden by default, shown on group hover) -->
            <select
                bind:value={type}
                on:change={changeType}
                class="opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200 text-xs py-0.5 rounded bg-white"
            >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
                <option value="null">Null</option>
            </select>
        </div>

        <!-- ACTIONS -->
        <div
            class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1"
        >
            {#if isObject}
                <button
                    class="text-green-600 hover:bg-green-100 p-1 rounded"
                    on:click|stopPropagation={addChild}
                    title="Add Child"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                </button>
            {/if}

            {#if !isRoot}
                <button
                    class="text-red-500 hover:bg-red-100 p-1 rounded"
                    on:click|stopPropagation={deleteNode}
                    title="Delete Node"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                </button>
            {/if}
        </div>
    </div>

    <!-- RECURSION -->
    {#if isObject && isOpen}
        <div class="children">
            {#if isArray}
                {#each value as child, i (i)}
                    <svelte:self
                        k={i}
                        bind:value={child}
                        on:delete={(e) => handleChildDelete(e.detail.k)}
                        on:rename={(e) =>
                            handleChildRename(e.detail.oldKey, e.detail.newKey)}
                    />
                {/each}
            {:else}
                {#each Object.entries(value) as [key, val] (key)}
                    <svelte:self
                        k={key}
                        bind:value={val}
                        on:delete={(e) => handleChildDelete(e.detail.k)}
                        on:rename={(e) =>
                            handleChildRename(e.detail.oldKey, e.detail.newKey)}
                    />
                {/each}
            {/if}
        </div>
    {/if}
</div>
