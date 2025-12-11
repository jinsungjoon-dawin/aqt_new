<script>
    let people = [
        {
            name: "Jane Cooper",
            title: "Regional Paradigm Technician",
            department: "Optimization",
            role: "Admin",
            email: "jane.cooper@example.com",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60",
            status: "Active",
        },
        {
            name: "Cody Fisher",
            title: "Product Directives Officer",
            department: "Intranet",
            role: "Owner",
            email: "cody.fisher@example.com",
            image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60",
            status: "Active",
        },
        {
            name: "Esther Howard",
            title: "Forward Response Developer",
            department: "Directives",
            role: "Member",
            email: "esther.howard@example.com",
            image: "https://images.unsplash.com/photo-1520813792240-56fc4a37b1a9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60",
            status: "Inactive",
        },
    ];
</script>

<div class="p-8 space-y-12 bg-gray-100 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-900">Tailwind CSS Table Samples</h1>

    <!-- 1. Simple Striped Table -->
    <section class="space-y-4">
        <h2 class="text-xl font-semibold text-gray-800">
            1. Simple Striped Table
        </h2>
        <div
            class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg"
        >
            <table class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-50">
                    <tr>
                        <th
                            scope="col"
                            class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                            >Name</th
                        >
                        <th
                            scope="col"
                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >Title</th
                        >
                        <th
                            scope="col"
                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >Email</th
                        >
                        <th
                            scope="col"
                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >Role</th
                        >
                        <th
                            scope="col"
                            class="relative py-3.5 pl-3 pr-4 sm:pr-6"
                            ><span class="sr-only">Edit</span></th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    {#each people as person, i}
                        <tr class={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td
                                class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6"
                                >{person.name}</td
                            >
                            <td
                                class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                                >{person.title}</td
                            >
                            <td
                                class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                                >{person.email}</td
                            >
                            <td
                                class="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                                >{person.role}</td
                            >
                            <td
                                class="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"
                            >
                                <a
                                    href="#"
                                    class="text-indigo-600 hover:text-indigo-900"
                                    >Edit</a
                                >
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </section>

    <!-- 2. Dark Header & Hoverable -->
    <section class="space-y-4">
        <h2 class="text-xl font-semibold text-gray-800">
            2. Dark Header & Hoverable Rows
        </h2>
        <div class="overflow-hidden shadow-md rounded-lg">
            <table class="min-w-full text-sm text-left text-gray-500">
                <thead class="text-xs text-gray-100 uppercase bg-gray-700">
                    <tr>
                        <th scope="col" class="px-6 py-3">Product Name</th>
                        <th scope="col" class="px-6 py-3">Color</th>
                        <th scope="col" class="px-6 py-3">Category</th>
                        <th scope="col" class="px-6 py-3">Price</th>
                        <th scope="col" class="px-6 py-3">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="bg-white border-b hover:bg-gray-50">
                        <th
                            scope="row"
                            class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                            >Apple MacBook Pro 17"</th
                        >
                        <td class="px-6 py-4">Silver</td>
                        <td class="px-6 py-4">Laptop</td>
                        <td class="px-6 py-4">$2999</td>
                        <td class="px-6 py-4"
                            ><a
                                href="#"
                                class="font-medium text-blue-600 hover:underline"
                                >Edit</a
                            ></td
                        >
                    </tr>
                    <tr class="bg-white border-b hover:bg-gray-50">
                        <th
                            scope="row"
                            class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                            >Microsoft Surface Pro</th
                        >
                        <td class="px-6 py-4">White</td>
                        <td class="px-6 py-4">Laptop PC</td>
                        <td class="px-6 py-4">$1999</td>
                        <td class="px-6 py-4"
                            ><a
                                href="#"
                                class="font-medium text-blue-600 hover:underline"
                                >Edit</a
                            ></td
                        >
                    </tr>
                    <tr class="bg-white hover:bg-gray-50">
                        <th
                            scope="row"
                            class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
                            >Magic Mouse 2</th
                        >
                        <td class="px-6 py-4">Black</td>
                        <td class="px-6 py-4">Accessories</td>
                        <td class="px-6 py-4">$99</td>
                        <td class="px-6 py-4"
                            ><a
                                href="#"
                                class="font-medium text-blue-600 hover:underline"
                                >Edit</a
                            ></td
                        >
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <!-- 3. Bordered Table with Avatars & Badges (Complex) -->
    <section class="space-y-4">
        <h2 class="text-xl font-semibold text-gray-800">
            3. Bordered Table with Avatars & Badges
        </h2>
        <div class="inline-block min-w-full py-2 align-middle">
            <div
                class="overflow-hidden border border-gray-200 shadow sm:rounded-lg"
            >
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th
                                scope="col"
                                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                >Name</th
                            >
                            <th
                                scope="col"
                                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                >Title</th
                            >
                            <th
                                scope="col"
                                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                >Status</th
                            >
                            <th
                                scope="col"
                                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                >Role</th
                            >
                            <th scope="col" class="relative px-6 py-3"
                                ><span class="sr-only">Edit</span></th
                            >
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {#each people as person}
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 w-10 h-10">
                                            <img
                                                class="w-10 h-10 rounded-full"
                                                src={person.image}
                                                alt=""
                                            />
                                        </div>
                                        <div class="ml-4">
                                            <div
                                                class="text-sm font-medium text-gray-900"
                                            >
                                                {person.name}
                                            </div>
                                            <div class="text-sm text-gray-500">
                                                {person.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900">
                                        {person.title}
                                    </div>
                                    <div class="text-sm text-gray-500">
                                        {person.department}
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span
                                        class="inline-flex px-2 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full"
                                    >
                                        {person.status}
                                    </span>
                                </td>
                                <td
                                    class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap"
                                    >{person.role}</td
                                >
                                <td
                                    class="px-6 py-4 text-sm font-medium text-right whitespace-nowrap"
                                >
                                    <a
                                        href="#"
                                        class="text-indigo-600 hover:text-indigo-900"
                                        >Edit</a
                                    >
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </section>

    <!-- 4. Compact Excel-like Table -->
    <section class="space-y-4">
        <h2 class="text-xl font-semibold text-gray-800">
            4. Compact / Grid Style (Excel-like)
        </h2>
        <div class="overflow-x-auto border border-gray-300">
            <table class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-100">
                    <tr>
                        <th
                            class="px-2 py-1 text-xs font-bold text-center text-gray-600 border-r border-gray-300 uppercase w-10"
                            >#</th
                        >
                        <th
                            class="px-2 py-1 text-xs font-bold text-left text-gray-600 border-r border-gray-300 uppercase"
                            >Item</th
                        >
                        <th
                            class="px-2 py-1 text-xs font-bold text-right text-gray-600 border-r border-gray-300 uppercase"
                            >Qty</th
                        >
                        <th
                            class="px-2 py-1 text-xs font-bold text-right text-gray-600 border-r border-gray-300 uppercase"
                            >Unit Price</th
                        >
                        <th
                            class="px-2 py-1 text-xs font-bold text-right text-gray-600 uppercase"
                            >Total</th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-300 bg-white">
                    <tr class="hover:bg-blue-50">
                        <td
                            class="px-2 py-1 text-xs text-center border-r border-gray-300"
                            >1</td
                        >
                        <td class="px-2 py-1 text-xs border-r border-gray-300"
                            >Widget A</td
                        >
                        <td
                            class="px-2 py-1 text-xs text-right border-r border-gray-300"
                            >10</td
                        >
                        <td
                            class="px-2 py-1 text-xs text-right border-r border-gray-300"
                            >$5.00</td
                        >
                        <td class="px-2 py-1 text-xs text-right">$50.00</td>
                    </tr>
                    <tr class="hover:bg-blue-50">
                        <td
                            class="px-2 py-1 text-xs text-center border-r border-gray-300"
                            >2</td
                        >
                        <td class="px-2 py-1 text-xs border-r border-gray-300"
                            >Widget B</td
                        >
                        <td
                            class="px-2 py-1 text-xs text-right border-r border-gray-300"
                            >5</td
                        >
                        <td
                            class="px-2 py-1 text-xs text-right border-r border-gray-300"
                            >$15.00</td
                        >
                        <td class="px-2 py-1 text-xs text-right">$75.00</td>
                    </tr>
                    <tr class="hover:bg-blue-50">
                        <td
                            class="px-2 py-1 text-xs text-center border-r border-gray-300"
                            >3</td
                        >
                        <td class="px-2 py-1 text-xs border-r border-gray-300"
                            >Widget C</td
                        >
                        <td
                            class="px-2 py-1 text-xs text-right border-r border-gray-300"
                            >20</td
                        >
                        <td
                            class="px-2 py-1 text-xs text-right border-r border-gray-300"
                            >$2.50</td
                        >
                        <td class="px-2 py-1 text-xs text-right">$50.00</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</div>
