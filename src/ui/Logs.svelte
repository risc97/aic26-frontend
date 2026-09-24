<script lang="ts">
  import { apiClient } from '../lib/api';
  import type { LogEntry, Item, TranscriptItem, TemporalItem } from '../lib/types';
  import MyDropdown from './common/MyDropdown.svelte';
  import type { SelectOption } from './common/MyDropdown.svelte';
  import { BORDER_STYLE, ACCENT_PALETTES } from './common/CommonStyle';

  import FileText from 'phosphor-svelte/lib/FileText';
  import ArrowClockwise from 'phosphor-svelte/lib/ArrowClockwise';
  import ArrowCounterClockwise from 'phosphor-svelte/lib/ArrowCounterClockwise';
  import Download from 'phosphor-svelte/lib/Download';
  import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
  import X from 'phosphor-svelte/lib/X';
  import WarningCircle from 'phosphor-svelte/lib/WarningCircle';
  import Copy from 'phosphor-svelte/lib/Copy';
  import Clock from 'phosphor-svelte/lib/Clock';
  import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
  import CaretRight from 'phosphor-svelte/lib/CaretRight';
  import Play from 'phosphor-svelte/lib/Play';
  import ImageBroken from 'phosphor-svelte/lib/ImageBroken';

  type Accent = 'blue' | 'rose' | 'emerald' | 'amber';

  interface WatchPayload {
    video_id: string;
    keyframe_id: string;
    frame_idx?: number;
    timestamp_ms?: number;
    video_fps?: number;
    time_start_ms?: number;
    time_end_ms?: number;
    transcriptText?: string;
    ocrText?: string;
    stageIndex?: number;
  }

  interface Props {
    onRestoreQuery?: (log: LogEntry) => void;
    onWatchVideo?: (payload: WatchPayload) => void;
  }

  let { onRestoreQuery, onWatchVideo }: Props = $props();

  // --- Static config ---

  const MODE_META: Record<string, { label: string; accent: Accent }> = {
    keyframe: { label: 'Semantic', accent: 'blue' },
    transcript_semantic: { label: 'Transcript Sem', accent: 'emerald' },
    transcript_exact: { label: 'Transcript Exact', accent: 'emerald' },
    ocr_exact: { label: 'OCR', accent: 'amber' },
    detect: { label: 'Detect', accent: 'rose' },
    temporal: { label: 'Temporal', accent: 'rose' },
    temporal_detect: { label: 'Temporal Detect', accent: 'rose' },
  };

  const MODE_OPTIONS: SelectOption[] = [
    { value: 'all', label: 'All Modes' },
    { value: 'keyframe', label: 'Semantic (Visual KF)' },
    { value: 'transcript_semantic', label: 'Transcript Semantic' },
    { value: 'transcript_exact', label: 'Transcript Exact' },
    { value: 'ocr_exact', label: 'OCR Exact' },
    { value: 'detect', label: 'Detect' },
    { value: 'temporal', label: 'Temporal Sequential' },
    { value: 'temporal_detect', label: 'Temporal Detect' },
  ];

  const MODEL_OPTIONS: SelectOption[] = [
    { value: 'all', label: 'All Models' },
    { value: 'siglip', label: 'siglip' },
    { value: 'siglip2', label: 'siglip2' },
    { value: 'pe', label: 'pe' },
    { value: 'gte', label: 'gte' },
  ];

  const PAGE_SIZE_OPTIONS: SelectOption[] = [
    { value: '25', label: '25 / page' },
    { value: '50', label: '50 / page' },
    { value: '100', label: '100 / page' },
  ];

  const CHIP = `${BORDER_STYLE} bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold font-mono text-slate-700`;
  const BTN = `inline-flex h-8 items-center gap-1.5 ${BORDER_STYLE} bg-white px-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40`;

  function modeMeta(mode: string) {
    return MODE_META[mode] ?? { label: mode, accent: 'blue' as Accent };
  }

  function badgeClass(accent: Accent) {
    return `${BORDER_STYLE} ${ACCENT_PALETTES[accent].bgSubtle} ${ACCENT_PALETTES[accent].textDark} px-1.5 py-0.5 text-[11px] font-bold`;
  }

  function btnAccentClass(accent: Accent) {
    return `inline-flex h-8 items-center gap-1.5 ${BORDER_STYLE} ${ACCENT_PALETTES[accent].bg} ${ACCENT_PALETTES[accent].hover} px-3 text-xs font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40`;
  }

  // --- State ---

  let logs = $state<LogEntry[]>([]);
  let loading = $state(false);
  let error = $state('');
  let selectedLog = $state<LogEntry | null>(null);
  let loadingDetail = $state(false);

  let limit = $state(50);
  let offset = $state(0);
  let pageSizeValue = $state('50');
  let filterMode = $state('all');
  let filterModel = $state('all');
  let searchQuery = $state('');

  let copiedId = $state<string | null>(null);
  let copiedQuery = $state(false);

  // --- Data loading ---

  async function loadLogs() {
    const currentLimit = limit;
    const currentOffset = offset;
    loading = true;
    error = '';
    try {
      const data = await apiClient.fetchLogs({ limit: currentLimit, offset: currentOffset });
      logs = data;
      if (data.length > 0 && !selectedLog) {
        selectedLog = data[0];
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load logs from server.';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    // Reading limit/offset synchronously (before the first await inside
    // loadLogs) registers them as this effect's dependencies.
    loadLogs();
  });

  $effect(() => {
    const next = Number(pageSizeValue);
    if (Number.isFinite(next) && next !== limit) {
      limit = next;
      offset = 0;
    }
  });

  async function handleSelectLog(log: LogEntry) {
    selectedLog = log;
    if (!log.results || log.results.length === 0) {
      loadingDetail = true;
      try {
        const detail = await apiClient.fetchLogById(log.request_id);
        if (detail) selectedLog = detail;
      } catch {
        // keep the basic log entry on failure
      } finally {
        loadingDetail = false;
      }
    }
  }

  let filteredLogs = $derived(
    logs.filter((item) => {
      if (filterMode !== 'all' && item.mode !== filterMode) return false;
      if (filterModel !== 'all' && item.model !== filterModel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const queryLower = (item.query || '').toLowerCase();
        const reqLower = (item.request_id || '').toLowerCase();
        if (!queryLower.includes(q) && !reqLower.includes(q)) return false;
      }
      return true;
    })
  );

  // --- Copy / export helpers ---

  async function handleCopyText(text: string | undefined, idKey: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (idKey === 'query') {
        copiedQuery = true;
        setTimeout(() => (copiedQuery = false), 2000);
      } else {
        copiedId = idKey;
        setTimeout(() => (copiedId = null), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function downloadBlob(content: string, mime: string, filename: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJson() {
    downloadBlob(
      JSON.stringify(filteredLogs, null, 2),
      'application/json',
      `aic_logs_${new Date().toISOString().slice(0, 10)}.json`
    );
  }

  function handleExportSnapshotCsv() {
    if (!selectedLog?.results || selectedLog.results.length === 0) return;
    let csv = '';
    if (selectedLog.mode === 'temporal' || selectedLog.mode === 'temporal_detect') {
      csv = 'video_id,frame_indices,score\n';
      (selectedLog.results as TemporalItem[]).forEach((row) => {
        const frames = (row.matches || []).map((m) => m.frame_idx ?? m.keyframe_id).join(';');
        csv += `${row.video_id},"${frames}",${row.score ?? ''}\n`;
      });
    } else {
      csv = 'video_id,frame_idx,keyframe_id,score,timestamp_ms,text\n';
      (selectedLog.results as (Item & { text?: string })[]).forEach((it) => {
        const vid = it.video_id || '';
        const fIdx = it.frame_idx ?? '';
        const kfId = it.keyframe_id ?? '';
        const sc = it.score ?? '';
        const ts = it.timestamp_ms ?? '';
        const txt = it.text ? `"${String(it.text).replace(/"/g, '""')}"` : '';
        csv += `${vid},${fIdx},${kfId},${sc},${ts},${txt}\n`;
      });
    }
    downloadBlob(csv, 'text/csv;charset=utf-8;', `log_${selectedLog.request_id.slice(0, 8)}_results.csv`);
  }

  // --- Typed views over the loosely-typed results union ---

  let transcriptResults = $derived((selectedLog?.results ?? []) as unknown as TranscriptItem[]);
  let temporalResults = $derived((selectedLog?.results ?? []) as unknown as TemporalItem[]);
  let keyframeResults = $derived((selectedLog?.results ?? []) as unknown as (Item & { text?: string })[]);
</script>

<div class="flex w-full flex-col gap-4 p-4 md:flex-row">
  <!-- LEFT COLUMN: Logs History & Filters -->
  <div class="flex h-[calc(100vh-130px)] w-full shrink-0 flex-col {BORDER_STYLE} bg-white md:w-[440px] lg:w-[480px]">
    <!-- Panel Header -->
    <div class="flex items-center justify-between border-b-2 border-slate-900 bg-slate-100 px-4 py-3">
      <div class="flex items-center gap-2">
        <div class="flex h-7 w-7 items-center justify-center {BORDER_STYLE} {ACCENT_PALETTES.amber.bg} text-white">
          <FileText size={15} weight="bold" />
        </div>
        <h2 class="text-sm font-bold text-slate-900">Query Logs History</h2>
        <span class={CHIP}>{filteredLogs.length} / {logs.length}</span>
      </div>

      <div class="flex items-center gap-1.5">
        <button type="button" onclick={loadLogs} disabled={loading} class={BTN} title="Refresh logs from server">
          <ArrowClockwise size={13} weight="bold" class={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>

        <button
          type="button"
          onclick={handleExportJson}
          disabled={filteredLogs.length === 0}
          class={BTN}
          title="Export filtered logs as JSON"
        >
          <Download size={13} weight="bold" />
          <span>JSON</span>
        </button>
      </div>
    </div>

    <!-- Filter Controls -->
    <div class="flex flex-col gap-2 border-b-2 border-slate-900 bg-slate-50 p-3">
      <div class="flex items-center gap-2">
        <MyDropdown items={MODE_OPTIONS} bind:value={filterMode} width="flex-1" height="h-8" accent="blue" />
        <MyDropdown items={MODEL_OPTIONS} bind:value={filterModel} width="w-28" height="h-8" accent="blue" />
      </div>

      <div class="relative flex items-center">
        <span class="pointer-events-none absolute left-2 text-slate-400">
          <MagnifyingGlass size={13} />
        </span>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search query text or request ID..."
          class="h-8 w-full {BORDER_STYLE} bg-white pl-7 pr-7 text-xs font-mono text-slate-900 outline-none transition-colors {ACCENT_PALETTES.blue.focusRing}"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={() => (searchQuery = '')}
            class="absolute right-2 text-slate-400 hover:text-slate-700"
          >
            <X size={13} />
          </button>
        {/if}
      </div>
    </div>

    <!-- Log Entries -->
    <div class="flex-1 overflow-y-auto p-3">
      {#if loading && logs.length === 0}
        <div class="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
          <ArrowClockwise size={24} class="animate-spin" />
          <span class="text-sm font-medium">Loading logs from server...</span>
        </div>
      {:else if error}
        <div class="flex flex-col items-center justify-center gap-2 border-2 border-rose-600 bg-rose-50 p-4 text-center text-rose-800">
          <WarningCircle size={20} weight="bold" />
          <span class="text-xs font-bold">{error}</span>
          <button
            type="button"
            onclick={loadLogs}
            class="mt-2 border-2 border-rose-800 bg-white px-3 py-1 text-xs font-bold hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      {:else if filteredLogs.length === 0}
        <div class="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-400">
          <FileText size={32} />
          <span class="text-sm font-bold text-slate-600">No logs found</span>
          <span class="text-xs text-slate-400">
            Execute searches in Single or Temporal mode to generate query logs.
          </span>
        </div>
      {:else}
        <div class="flex flex-col gap-2">
          {#each filteredLogs as item (item.request_id)}
            {@const meta = modeMeta(item.mode)}
            {@const isSelected = selectedLog?.request_id === item.request_id}
            <div
              role="button"
              tabindex="0"
              onclick={() => handleSelectLog(item)}
              onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectLog(item)}
              class="group cursor-pointer border-2 p-3 transition-colors {isSelected
                ? 'border-amber-600 bg-amber-50 shadow-sm'
                : 'border-slate-900 bg-white hover:bg-slate-50'}"
            >
              <!-- Top row -->
              <div class="flex items-center justify-between gap-1 text-[11px]">
                <div class="flex items-center gap-1.5">
                  <span class={badgeClass(meta.accent)}>{meta.label}</span>
                  {#if item.model}
                    <span class="border border-slate-300 bg-slate-100 px-1 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                      {item.model}
                    </span>
                  {/if}
                </div>
                <span class="font-mono text-[11px] text-slate-500">{item.timestamp || 'N/A'}</span>
              </div>

              <!-- Query string -->
              <p class="mt-2 line-clamp-2 text-sm font-bold text-slate-900">{item.query}</p>

              <!-- Footer -->
              <div class="mt-2.5 flex items-center justify-between border-t border-slate-200 pt-2 text-[11px]">
                <div class="flex items-center gap-2 text-slate-600">
                  <span class="font-medium">
                    Results: <strong>{item.total ?? (item.results?.length ?? 0)}</strong>
                  </span>
                  <span class="text-slate-300">|</span>
                  <button
                    type="button"
                    onclick={(e) => {
                      e.stopPropagation();
                      handleCopyText(item.request_id, item.request_id);
                    }}
                    class="font-mono text-[10px] text-slate-500 hover:text-slate-900"
                    title="Click to copy Request ID"
                  >
                    {#if copiedId === item.request_id}
                      <span class="font-bold text-emerald-600">Copied!</span>
                    {:else}
                      <span>{item.request_id.slice(0, 8)}...</span>
                    {/if}
                  </button>
                </div>

                {#if onRestoreQuery}
                  <button
                    type="button"
                    onclick={(e) => {
                      e.stopPropagation();
                      onRestoreQuery?.(item);
                    }}
                    class="flex h-6 items-center gap-1 border border-slate-900 bg-slate-100 px-1.5 text-[10px] font-bold text-slate-800 hover:bg-blue-700 hover:text-white"
                    title="Re-run this query"
                  >
                    <ArrowCounterClockwise size={10} weight="bold" />
                    <span>Re-run</span>
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Pagination Footer -->
    <div class="flex items-center justify-between border-t-2 border-slate-900 bg-slate-100 px-4 py-2.5">
      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={() => (offset = Math.max(0, offset - limit))}
          disabled={offset === 0 || loading}
          class={BTN}
        >
          <CaretLeft size={13} weight="bold" />
          <span>Prev</span>
        </button>

        <button
          type="button"
          onclick={() => (offset = offset + limit)}
          disabled={logs.length < limit || loading}
          class={BTN}
        >
          <span>Next</span>
          <CaretRight size={13} weight="bold" />
        </button>
      </div>

      <div class="flex items-center gap-2 text-xs font-mono font-medium text-slate-600">
        <span>Offset: {offset}</span>
        <MyDropdown items={PAGE_SIZE_OPTIONS} bind:value={pageSizeValue} width="w-24" height="h-7" accent="blue" />
      </div>
    </div>
  </div>

  <!-- RIGHT COLUMN: Log Inspector -->
  <div class="flex h-[calc(100vh-130px)] flex-1 flex-col overflow-hidden {BORDER_STYLE} bg-white">
    {#if selectedLog}
      {@const meta = modeMeta(selectedLog.mode)}
      <!-- Inspector Top Info Bar -->
      <div class="flex flex-col gap-3 border-b-2 border-slate-900 bg-slate-50 p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class={badgeClass(meta.accent)}>{meta.label}</span>
            {#if selectedLog.model}
              <span class="{BORDER_STYLE} bg-white px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                Model: {selectedLog.model}
              </span>
            {/if}
            <span class="flex items-center gap-1 font-mono text-xs text-slate-500">
              <Clock size={13} />
              {selectedLog.timestamp || 'N/A'}
            </span>
          </div>

          <div class="flex items-center gap-2">
            {#if onRestoreQuery}
              <button
                type="button"
                onclick={() => selectedLog && onRestoreQuery?.(selectedLog)}
                class={btnAccentClass('blue')}
                title="Load query into search bar and switch tab"
              >
                <ArrowCounterClockwise size={14} weight="bold" />
                <span>Re-run Query</span>
              </button>
            {/if}

            <button
              type="button"
              onclick={handleExportSnapshotCsv}
              disabled={!selectedLog.results || selectedLog.results.length === 0}
              class={BTN}
              title="Export snapshot results as CSV"
            >
              <Download size={14} weight="bold" />
              <span>Export Results CSV</span>
            </button>
          </div>
        </div>

        <!-- Request ID + Limits -->
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-1.5 font-mono text-slate-600">
            <span class="font-bold text-slate-800">Request ID:</span>
            <span class="border border-slate-300 bg-white px-2 py-0.5 text-slate-900">{selectedLog.request_id}</span>
            <button
              type="button"
              onclick={() => selectedLog && handleCopyText(selectedLog.request_id, 'reqId')}
              class="border border-slate-900 bg-white p-1 hover:bg-slate-100"
              title="Copy Request ID"
            >
              {#if copiedId === 'reqId'}
                <span class="text-[10px] font-bold text-emerald-600">Copied!</span>
              {:else}
                <Copy size={12} />
              {/if}
            </button>
          </div>

          <div class="flex items-center gap-3 font-mono text-slate-600">
            <span>Limit: <strong>{selectedLog.limit ?? 100}</strong></span>
            <span>Total Results: <strong>{selectedLog.total ?? (selectedLog.results?.length ?? 0)}</strong></span>
          </div>
        </div>

        <!-- Query Box -->
        <div class="flex items-center justify-between {BORDER_STYLE} bg-white p-2.5">
          <div class="flex min-w-0 items-start gap-2">
            <span class="shrink-0 text-slate-400"><MagnifyingGlass size={16} /></span>
            <p class="truncate font-mono text-sm font-bold text-slate-900">{selectedLog.query}</p>
          </div>

          <button
            type="button"
            onclick={() => selectedLog && handleCopyText(selectedLog.query, 'query')}
            class="shrink-0 border border-slate-900 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
            title="Copy search query text"
          >
            {copiedQuery ? 'Copied!' : 'Copy Query'}
          </button>
        </div>
      </div>

      <!-- Results Snapshot Body -->
      <div class="flex-1 overflow-y-auto p-4">
        {#if loadingDetail}
          <div class="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
            <ArrowClockwise size={24} class="animate-spin" />
            <span class="text-sm font-medium">Loading snapshot details...</span>
          </div>
        {:else if !selectedLog.results || selectedLog.results.length === 0}
          <div class="flex flex-col items-center justify-center gap-2 py-16 text-center text-slate-400">
            <ImageBroken size={36} />
            <span class="text-sm font-bold text-slate-600">No result items stored for this request.</span>
          </div>
        {:else if selectedLog.mode === 'temporal' || selectedLog.mode === 'temporal_detect'}
          <!-- Temporal Sequence Results -->
          <div class="flex flex-col gap-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">
              Temporal Sequence Matches ({temporalResults.length} videos)
            </h3>
            {#each temporalResults as vidItem, vIdx (vIdx)}
              <div class="{BORDER_STYLE} bg-slate-50 p-3">
                <div class="mb-2 flex items-center justify-between">
                  <span class="font-mono text-sm font-bold text-slate-900">
                    #{vidItem.rank || vIdx + 1} - Video: {vidItem.video_id}
                  </span>
                  {#if vidItem.score !== undefined}
                    <span class={CHIP}>Score: {Number(vidItem.score).toFixed(4)}</span>
                  {/if}
                </div>

                <div class="flex gap-3 overflow-x-auto pb-2">
                  {#each vidItem.matches || [] as m, mIdx (mIdx)}
                    {@const kfId = m.keyframe_id || String(m.frame_idx || 0)}
                    {@const imgUrl = apiClient.getKeyframeImageUrl(m.video_id || vidItem.video_id, kfId)}
                    <div class="w-48 shrink-0 {BORDER_STYLE} bg-white p-2">
                      <div class="group relative aspect-video w-full overflow-hidden bg-slate-900">
                        <img src={imgUrl} alt="Frame {kfId}" class="h-full w-full object-cover" loading="lazy" />
                        {#if onWatchVideo}
                          <button
                            type="button"
                            onclick={() =>
                              onWatchVideo?.({
                                video_id: m.video_id || vidItem.video_id,
                                keyframe_id: kfId,
                                frame_idx: m.frame_idx,
                                timestamp_ms: m.timestamp_ms,
                                video_fps: m.video_fps || 25,
                                stageIndex: mIdx,
                              })}
                            class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <span class="flex items-center gap-1 border border-white bg-black/75 px-2 py-1 text-xs font-bold text-white">
                              <Play size={12} weight="fill" /> Play
                            </span>
                          </button>
                        {/if}
                      </div>
                      <div class="mt-1.5 flex items-center justify-between font-mono text-[11px]">
                        <span class="font-bold text-slate-800">Stage {mIdx + 1}</span>
                        <span class="text-slate-600">#{m.frame_idx ?? kfId}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {:else if selectedLog.mode === 'transcript_semantic' || selectedLog.mode === 'transcript_exact'}
          <!-- Transcript Matches -->
          <div class="flex flex-col gap-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">
              Transcript Matches ({transcriptResults.length} results)
            </h3>
            {#each transcriptResults as tItem, tIdx (tIdx)}
              <div class="{BORDER_STYLE} bg-slate-50 p-3">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-mono font-bold text-slate-900">{tItem.video_id}</span>
                  {#if tItem.time_start_ms !== undefined}
                    <span class="font-mono text-slate-500">
                      {(tItem.time_start_ms / 1000).toFixed(1)}s - {((tItem.time_end_ms || 0) / 1000).toFixed(1)}s
                    </span>
                  {/if}
                </div>
                <p class="mt-1.5 border-l-2 border-emerald-600 pl-2 text-sm italic text-slate-800">"{tItem.text}"</p>

                {#if tItem.keyframes && tItem.keyframes.length > 0}
                  <div class="mt-2 flex gap-2 overflow-x-auto">
                    {#each tItem.keyframes as kf, kfIdx (kfIdx)}
                      {@const imgUrl = apiClient.getKeyframeImageUrl(tItem.video_id, kf.keyframe_id)}
                      <div class="w-32 shrink-0 border border-slate-900 bg-white p-1">
                        <img src={imgUrl} alt="keyframe" class="aspect-video w-full object-cover" loading="lazy" />
                        <div class="mt-1 flex items-center justify-between font-mono text-[10px]">
                          <span>#{kf.frame_idx || kf.keyframe_id}</span>
                          {#if onWatchVideo}
                            <button
                              type="button"
                              onclick={() =>
                                onWatchVideo?.({
                                  video_id: tItem.video_id,
                                  keyframe_id: kf.keyframe_id,
                                  frame_idx: kf.frame_idx,
                                  timestamp_ms: kf.timestamp_ms,
                                  time_start_ms: tItem.time_start_ms,
                                  time_end_ms: tItem.time_end_ms,
                                  transcriptText: tItem.text,
                                })}
                              class="text-blue-700 hover:underline"
                            >
                              Play
                            </button>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <!-- Keyframe / OCR / Detect Results Grid -->
          <div>
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">
                Returned Keyframes ({keyframeResults.length} items)
              </h3>
            </div>

            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {#each keyframeResults as kf, idx (idx)}
                {@const vid = kf.video_id || 'UNKNOWN'}
                {@const kfId = String(kf.keyframe_id || kf.frame_idx || '0')}
                {@const frameIdx = kf.frame_idx ?? kf.keyframe_id}
                {@const score = kf.score !== undefined && kf.score !== null ? Number(kf.score).toFixed(4) : null}
                {@const imgUrl = apiClient.getKeyframeImageUrl(vid, kfId)}
                <div class="group relative flex flex-col {BORDER_STYLE} bg-white p-2 transition-shadow hover:shadow-md">
                  <!-- Thumbnail -->
                  <div class="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img
                      src={imgUrl}
                      alt="{vid} #{kfId}"
                      class="h-full w-full object-cover"
                      loading="lazy"
                      onerror={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />

                    {#if onWatchVideo}
                      <button
                        type="button"
                        onclick={() =>
                          onWatchVideo?.({
                            video_id: vid,
                            keyframe_id: kfId,
                            frame_idx: kf.frame_idx,
                            timestamp_ms: kf.timestamp_ms,
                            video_fps: kf.video_fps || 25,
                            ocrText: kf.text,
                          })}
                        class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <span class="flex items-center gap-1 border-2 border-white bg-black px-2.5 py-1 text-xs font-bold text-white">
                          <Play size={13} weight="fill" />
                          <span>Watch</span>
                        </span>
                      </button>
                    {/if}
                  </div>

                  <!-- Metadata -->
                  <div class="mt-2 flex flex-col gap-1 font-mono text-xs">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-slate-900">{vid}</span>
                      <span class="text-slate-600">Frame #{frameIdx}</span>
                    </div>
                    <div class="flex items-center justify-between text-[11px] text-slate-500">
                      {#if score}
                        <span class="border border-slate-900 bg-amber-100 px-1 font-bold text-amber-900">
                          Score: {score}
                        </span>
                      {:else}
                        <span></span>
                      {/if}
                      {#if kf.timestamp_ms !== undefined}
                        <span class="ml-auto font-bold text-slate-600">{(kf.timestamp_ms / 1000).toFixed(1)}s</span>
                      {/if}
                    </div>

                    {#if kf.text}
                      <p class="mt-1 line-clamp-2 border-t border-slate-100 pt-1 font-sans text-[11px] text-slate-700">
                        📝 {kf.text}
                      </p>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-400">
        <div class="flex h-14 w-14 items-center justify-center {BORDER_STYLE} bg-slate-100 text-slate-500">
          <FileText size={28} />
        </div>
        <h3 class="text-base font-bold text-slate-700">Select a Query Log</h3>
        <p class="max-w-md text-xs leading-relaxed text-slate-500">
          Click any log entry on the left to inspect its parameters, full request ID, and preview the snapshot of
          keyframes and items returned from the search engine.
        </p>
      </div>
    {/if}
  </div>
</div>