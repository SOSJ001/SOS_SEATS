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
  export let isLoading: boolean = false;

  function getTransactionIcon(iconType: string) {
    switch (iconType) {
      case "deposit":
        return `<svg class="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>`;
      case "withdrawal":
        return `<svg class="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 20 20">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>`;
      case "ticket":
        return `<svg class="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
        </svg>`;
      case "refund":
        return `<svg class="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>`;
      default:
        return `<svg class="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 20 20">
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

<div class="space-y-3 sm:space-y-4 md:space-y-6">
  <h2 class="text-base sm:text-lg md:text-xl font-bold text-white px-1">
    Recent Transactions
  </h2>

  <div class="space-y-2 sm:space-y-3">
    {#if isLoading}
      <div class="flex items-center justify-center gap-2 sm:gap-3 py-6 sm:py-8">
        <svg
          class="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-cyan-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span class="text-gray-400 text-xs sm:text-sm">Loading transactions...</span>
      </div>
    {:else if transactions.length === 0}
      <div class="text-gray-400 text-xs sm:text-sm px-1 py-2">No recent transactions.</div>
    {:else}
      {#each transactions as transaction}
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 hover:bg-gray-700/50 transition-colors">
          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <!-- Left side - Icon and Description -->
            <div class="flex items-start sm:items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
              <!-- Transaction Icon -->
              <div
                class="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0"
              >
                {@html getTransactionIcon(transaction.icon)}
              </div>

              <!-- Description and Date -->
              <div class="min-w-0 flex-1 overflow-hidden">
                <p class="text-white font-medium text-xs sm:text-sm md:text-base truncate leading-tight sm:leading-normal mb-1 sm:mb-0.5">
                  {transaction.description}
                </p>
                <p class="text-gray-400 text-xs sm:text-sm truncate">
                  {transaction.date}
                </p>
              </div>
            </div>

            <!-- Right side - Amount and Status -->
            <div
              class="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-shrink-0"
            >
              <!-- Amount -->
              <span
                class="font-semibold text-xs sm:text-sm md:text-base {getAmountClass(
                  transaction.amount
                )} whitespace-nowrap"
              >
                {transaction.amount}
              </span>

              <!-- Status Tag -->
              <span
                class="px-2 py-1 text-[10px] sm:text-xs font-medium rounded-full {getStatusClass(
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
