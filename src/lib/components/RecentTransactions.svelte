<script lang="ts">
  // Dynamic transactions passed from parent
  export let transactions: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
    amount: string;
    status: string;
    icon: string;
  }> = [];

  function getTransactionIcon(iconType: string) {
    switch (iconType) {
      case "deposit":
        return `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>`;
      case "withdrawal":
        return `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>`;
      case "ticket":
        return `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
        </svg>`;
      case "refund":
        return `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>`;
      default:
        return `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
        </svg>`;
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white";
      case "pending":
        return "bg-yellow-400 text-black";
      case "failed":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  }

  function getAmountClass(amount: string) {
    return amount.startsWith("+") ? "text-green-400" : "text-red-400";
  }
</script>

<div class="space-y-4 md:space-y-6">
  <h2 class="text-lg md:text-xl font-bold text-white">Recent Transactions</h2>

  <div class="space-y-3">
    {#if transactions.length === 0}
      <div class="text-gray-400 text-sm">No recent transactions.</div>
    {:else}
      {#each transactions as transaction}
        <div class="bg-gray-800 rounded-lg p-3 md:p-4">
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0"
          >
            <!-- Left side - Icon and Description -->
            <div class="flex items-center space-x-3 md:space-x-4">
              <!-- Transaction Icon -->
              <div
                class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0"
              >
                {@html getTransactionIcon(transaction.icon)}
              </div>

              <!-- Description and Date -->
              <div class="min-w-0 flex-1">
                <p class="text-white font-medium text-sm md:text-base truncate">
                  {transaction.description}
                </p>
                <p class="text-gray-400 text-xs md:text-sm">
                  {transaction.date}
                </p>
              </div>
            </div>

            <!-- Right side - Amount and Status -->
            <div
              class="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3"
            >
              <!-- Amount -->
              <span
                class="font-semibold text-sm md:text-base {getAmountClass(
                  transaction.amount
                )}"
              >
                {transaction.amount}
              </span>

              <!-- Status Tag -->
              <span
                class="px-2 py-1 text-xs font-medium rounded-full {getStatusClass(
                  transaction.status
                )} whitespace-nowrap"
              >
                {transaction.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
