<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  type Row = {
    name: string;
    ok: boolean | null;
    latencyMs: number | null;
    detail: string;
    checkedAt: string | null;
  };

  let rows: Row[] = [
    { name: "Monime API", ok: null, latencyMs: null, detail: "—", checkedAt: null },
    { name: "Solana RPC", ok: null, latencyMs: null, detail: "—", checkedAt: null },
  ];

  let interval: ReturnType<typeof setInterval>;

  async function pingMonime() {
    const t = Date.now();
    try {
      const res = await fetch("/api/health/monime");
      const j = await res.json();
      rows = rows.map((r) =>
        r.name === "Monime API"
          ? {
              name: r.name,
              ok: Boolean(j.ok),
              latencyMs: typeof j.latencyMs === "number" ? j.latencyMs : Date.now() - t,
              detail: `HTTP ${j.status ?? res.status}`,
              checkedAt: j.checkedAt ?? new Date().toISOString(),
            }
          : r
      );
    } catch {
      rows = rows.map((r) =>
        r.name === "Monime API"
          ? {
              name: r.name,
              ok: false,
              latencyMs: null,
              detail: "Request failed",
              checkedAt: new Date().toISOString(),
            }
          : r
      );
    }
  }

  async function pingSolana() {
    const t = Date.now();
    try {
      const res = await fetch("/api/health/solana");
      const j = await res.json();
      rows = rows.map((r) =>
        r.name === "Solana RPC"
          ? {
              name: r.name,
              ok: Boolean(j.ok),
              latencyMs: typeof j.latencyMs === "number" ? j.latencyMs : Date.now() - t,
              detail:
                j.slot != null ? `slot ${j.slot}` : `HTTP ${j.status ?? res.status}`,
              checkedAt: j.checkedAt ?? new Date().toISOString(),
            }
          : r
      );
    } catch {
      rows = rows.map((r) =>
        r.name === "Solana RPC"
          ? {
              name: r.name,
              ok: false,
              latencyMs: null,
              detail: "Request failed",
              checkedAt: new Date().toISOString(),
            }
          : r
      );
    }
  }

  async function runChecks() {
    await Promise.all([pingMonime(), pingSolana()]);
  }

  onMount(() => {
    runChecks();
    interval = setInterval(runChecks, 45000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<svelte:head>
  <title>SOS Pulse | Ops</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-white">SOS Pulse</h1>
    <p class="text-gray-400 text-sm mt-1">
      Ops-only health view. Configure <code class="text-cyan-300/90">OPS_ADMIN_USER_IDS</code> with
      comma-separated user ids to access this page.
    </p>
  </div>

  <div class="rounded-xl border border-gray-700 overflow-hidden">
    <table class="w-full text-left text-sm">
      <thead class="bg-gray-800 text-gray-300 uppercase text-xs">
        <tr>
          <th class="px-4 py-3">Service</th>
          <th class="px-4 py-3">Status</th>
          <th class="px-4 py-3">Latency</th>
          <th class="px-4 py-3">Detail</th>
          <th class="px-4 py-3">Last check</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-700 bg-gray-900/60">
        {#each rows as row}
          <tr>
            <td class="px-4 py-3 text-white font-medium">{row.name}</td>
            <td class="px-4 py-3">
              {#if row.ok === null}
                <span class="text-gray-500">…</span>
              {:else if row.ok}
                <span class="text-green-400">OK</span>
              {:else}
                <span class="text-red-400">Down</span>
              {/if}
            </td>
            <td class="px-4 py-3 text-gray-300">
              {row.latencyMs != null ? `${row.latencyMs} ms` : "—"}
            </td>
            <td class="px-4 py-3 text-gray-400">{row.detail}</td>
            <td class="px-4 py-3 text-gray-500 text-xs">
              {row.checkedAt ? new Date(row.checkedAt).toLocaleTimeString() : "—"}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <button
    type="button"
    class="text-sm text-cyan-400 hover:text-cyan-300"
    on:click={runChecks}
  >
    Run checks now
  </button>
</div>
