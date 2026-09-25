<script lang="ts">
  import { Dialog, Button } from "bits-ui";
  import { submissionHistory, type SubmissionHistoryEntry } from "../lib/submissionHistory.svelte";
  import { BORDER_STYLE, ACCENT_PALETTES, PRESSED_ANIM } from "./common/CommonStyle";
  import { TrashIcon, CheckCircleIcon, XCircleIcon, WarningCircleIcon } from "phosphor-svelte";

  let { open = $bindable(false) }: { open: boolean } = $props();

  const typeBadgeClass: Record<SubmissionHistoryEntry["type"], string> = {
    KIS: `${ACCENT_PALETTES.blue.bg} text-white`,
    QA: `${ACCENT_PALETTES.emerald.bg} text-white`,
    TRAKE: `${ACCENT_PALETTES.rose.bg} text-white`,
  };

  function formatTimestamp(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatMs(ms?: number): string {
    if (ms === undefined || ms === null) return "-";
    const totalSec = Math.floor(ms / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    const msRem = ms % 1000;
    return `${mm}:${ss.toString().padStart(2, "0")}.${msRem.toString().padStart(3, "0")}`;
  }

  function describe(entry: SubmissionHistoryEntry): string {
    switch (entry.type) {
      case "KIS":
        return `t=${formatMs(entry.timeMs)} (±${entry.rangeMs ?? 0}ms)`;
      case "QA":
        return `answer="${entry.answer ?? ""}" @ ${formatMs(entry.timeMs)}`;
      case "TRAKE":
        return `frames=[${(entry.frameIds ?? []).join(", ")}]`;
    }
  }

  function handleClearAll() {
    if (submissionHistory.entries.length === 0) return;
    if (confirm("Clear all submission history? This cannot be undone.")) {
      submissionHistory.clear();
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
    <Dialog.Content
      class="fixed left-1/2 top-1/2 z-50 flex max-h-[80vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col {BORDER_STYLE} bg-white p-6 shadow-xl"
    >
      <div class="flex items-center gap-2 pb-3">
        <Dialog.Title class="select-none text-lg font-bold">Submission History</Dialog.Title>
        <span class="select-none text-xs font-semibold text-slate-500">
          ({submissionHistory.entries.length})
        </span>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto">
        {#if submissionHistory.entries.length === 0}
          <div class="flex h-32 flex-col items-center justify-center gap-1 text-slate-400 select-none">
            <p class="text-sm font-semibold">No submissions yet</p>
          </div>
        {:else}
          <div class="flex flex-col gap-2">
            {#each submissionHistory.entries as entry (entry.id)}
              <div class="flex items-start justify-between gap-3 {BORDER_STYLE} bg-slate-50 p-3">
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide select-none {typeBadgeClass[entry.type]}">
                      {entry.type}
                    </span>
                    <span class="min-w-0 truncate text-sm font-semibold text-slate-900">{entry.videoId}</span>
                    {#if entry.error}
                      <span class="flex items-center gap-1 text-xs font-semibold text-rose-600 select-none">
                        <WarningCircleIcon size="14px" weight="bold" />
                        Failed
                      </span>
                    {:else if entry.correct}
                      <span class="flex items-center gap-1 text-xs font-semibold text-emerald-600 select-none">
                        <CheckCircleIcon size="14px" weight="bold" />
                        Correct
                      </span>
                    {:else}
                      <span class="flex items-center gap-1 text-xs font-semibold text-slate-500 select-none">
                        <XCircleIcon size="14px" weight="bold" />
                        Wrong
                      </span>
                    {/if}
                  </div>
                  <div class="min-w-0 break-words text-xs text-slate-600">{describe(entry)}</div>
                  {#if entry.description}
                    <div class="min-w-0 break-words text-xs text-slate-500">{entry.description}</div>
                  {/if}
                  {#if entry.error}
                    <div class="min-w-0 break-words text-xs text-rose-500">{entry.error}</div>
                  {/if}
                  <div class="text-[11px] text-slate-400 select-none">{formatTimestamp(entry.timestamp)}</div>
                </div>
                <Button.Root
                  type="button"
                  onclick={() => submissionHistory.remove(entry.id)}
                  aria-label="Delete entry"
                  class="flex h-7 w-7 shrink-0 items-center justify-center {BORDER_STYLE} {PRESSED_ANIM} bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                >
                  <TrashIcon size="13px" weight="bold" />
                </Button.Root>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="mt-4 flex flex-col gap-2">
        <Button.Root
          onclick={handleClearAll}
          disabled={submissionHistory.entries.length === 0}
          class="{BORDER_STYLE} {PRESSED_ANIM} flex select-none items-center justify-center gap-1.5 {ACCENT_PALETTES.rose.bg} {ACCENT_PALETTES.rose.hover} p-2 text-sm font-semibold text-white outline-none disabled:opacity-50"
        >
          <TrashIcon size="14px" weight="bold" />
          Clear all
        </Button.Root>

        <button
          onclick={() => { open = false; }}
          class="{BORDER_STYLE} select-none bg-white p-1 text-sm font-semibold {PRESSED_ANIM} text-slate-900"
        >
          Done
        </button>
      </div>

      <Dialog.Close class="absolute right-4 top-4 h-8 w-8 p-1 text-sm font-bold {PRESSED_ANIM} {BORDER_STYLE}">
        ✕
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>