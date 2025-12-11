<script>
    import { onMount } from "svelte";

    // Mock Data for "Recent Transactions" or similar
    let recentactivity = [
        {
            id: 1,
            title: "IBK 기업은행 통신",
            status: "Success",
            time: "10:42 AM",
            amount: "+2,400",
            icon: "🏦",
            color: "bg-blue-100 text-blue-600",
        },
        {
            id: 2,
            title: "KB 국민은행 승인",
            status: "Pending",
            time: "10:30 AM",
            amount: "+1,250",
            icon: "💳",
            color: "bg-yellow-100 text-yellow-600",
        },
        {
            id: 3,
            title: "시스템 알림",
            status: "Warning",
            time: "09:15 AM",
            amount: "Alert",
            icon: "🔔",
            color: "bg-red-100 text-red-600",
        },
        {
            id: 4,
            title: "데이터 동기화",
            status: "Success",
            time: "09:00 AM",
            amount: "Done",
            icon: "🔄",
            color: "bg-green-100 text-green-600",
        },
    ];

    // Stats Data
    let stats = [
        {
            title: "Total Traffic",
            value: "2.4M",
            trend: "+12.5%",
            positive: true,
            icon: "📈",
        },
        {
            title: "Active Users",
            value: "45.2k",
            trend: "+5.2%",
            positive: true,
            icon: "👥",
        },
        {
            title: "Server Load",
            value: "32%",
            trend: "-2.1%",
            positive: true,
            icon: "⚡",
        },
        {
            title: "Error Rate",
            value: "0.12%",
            trend: "+0.02%",
            positive: false,
            icon: "⚠️",
        },
    ];
</script>

<div class="min-h-screen bg-gray-50/50 p-6 lg:p-10 font-sans text-slate-800">
    <!-- Hero Section -->
    <div class="mb-10 max-w-5xl mx-auto text-center space-y-4">
        <h1 class="text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span
                class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"
            >
                Next Gen Dashboard
            </span>
        </h1>
        <p class="text-lg text-slate-500 max-w-2xl mx-auto">
            Experience the future of data management with our streamlined,
            high-performance interface. Beautifully designed for clarity and
            efficiency.
        </p>
        <div class="pt-4 flex justify-center gap-4">
            <button
                class="px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300"
            >
                Get Started
            </button>
            <button
                class="px-6 py-3 rounded-full bg-white text-indigo-600 font-semibold border border-indigo-100 shadow-sm hover:bg-indigo-50 hover:-translate-y-1 transition-all duration-300"
            >
                View Documentation
            </button>
        </div>
    </div>

    <!-- Stats Grid -->
    <div
        class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
    >
        {#each stats as stat}
            <div
                class="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 cursor-pointer"
            >
                <div class="flex items-center justify-between mb-4">
                    <div class="text-2xl">{stat.icon}</div>
                    <span
                        class={`text-xs font-bold px-2 py-1 rounded-full ${stat.positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                        {stat.trend}
                    </span>
                </div>
                <div>
                    <p class="text-sm font-medium text-slate-400 mb-1">
                        {stat.title}
                    </p>
                    <h3
                        class="text-3xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors"
                    >
                        {stat.value}
                    </h3>
                </div>
            </div>
        {/each}
    </div>

    <!-- Main Content Area: Modern Table -->
    <div
        class="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
    >
        <div
            class="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-white to-slate-50"
        >
            <div>
                <h2 class="text-xl font-bold text-slate-800">
                    Recent Transactions
                </h2>
                <p class="text-sm text-slate-500">
                    Real-time monitoring of system activities
                </p>
            </div>
            <div class="flex items-center gap-2">
                <button
                    class="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path></svg
                    >
                </button>
                <div class="h-4 w-px bg-slate-200 mx-1"></div>
                <button
                    class="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    Export Data
                </button>
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr
                        class="text-xs font-semibold tracking-wide text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100"
                    >
                        <th class="px-6 py-4">Transaction</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Time</th>
                        <th class="px-6 py-4 text-right">Amount / Result</th>
                        <th class="px-6 py-4 text-center">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    {#each recentactivity as item}
                        <tr
                            class="hover:bg-indigo-50/30 transition-colors group"
                        >
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div
                                        class={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${item.color}`}
                                    >
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p class="font-semibold text-slate-700">
                                            {item.title}
                                        </p>
                                        <p class="text-xs text-slate-400">
                                            ID: #{item.id}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span
                                    class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        item.status === "Success"
                                            ? "bg-green-100 text-green-800"
                                            : item.status === "Pending"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {item.status}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-slate-500">
                                {item.time}
                            </td>
                            <td
                                class="px-6 py-4 text-right font-mono text-sm text-slate-700"
                            >
                                {item.amount}
                            </td>
                            <td class="px-6 py-4 text-center">
                                <button
                                    class="text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <div class="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
            <button
                class="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                View All Transactions &rarr;
            </button>
        </div>
    </div>
</div>
