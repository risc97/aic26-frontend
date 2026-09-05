<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import { ApiClient } from '../lib/api';
  import type { Item, TranscriptItem, OcrItem } from '../lib/types';

  const api = new ApiClient();

  // Search state
  let singleQuery = $state('');
  let videoKeyframeId = $state('');
  let singleSearchMode = $state('keyframe'); // 'keyframe' | 'transcript_semantic' | 'transcript_exact' | 'ocr_exact' | 'video_id'
  let modelKeyframe = $state('siglip'); // 'siglip' | 'siglip2' | 'pe'
  let modelTranscriptSemantic = $state('gte');
  let singleLimit = $state(100);
  let singlePhrase = $state(false);
  let showFilterDrawer = $state(false);

  // Results & Loading state
  let isSearching = $state(false);
  let errorMessage = $state<string | null>(null);
  let results = $state<(Item | TranscriptItem | OcrItem)[]>([]);
  let totalCount = $state(0);

  const MODE_OPTIONS = [
    { value: 'keyframe', label: 'Semantic', icon: 'sparkles' },
    { value: 'transcript_semantic', label: 'Transcript', icon: 'message-square' },
    { value: 'transcript_exact', label: 'Transcript Exact', icon: 'file-text' },
    { value: 'ocr_exact', label: 'OCR', icon: 'scan-text' },
    { value: 'video_id', label: 'Video ID', icon: 'film' },
  ];

  let currentModeObj = $derived(MODE_OPTIONS.find((o) => o.value === singleSearchMode));
  let modeLabel = $derived(currentModeObj?.label || 'Semantic');

  async function handleSearch() {
    isSearching = true;
    errorMessage = null;
    results = [];
    totalCount = 0;

    try {
      if (singleSearchMode === 'keyframe') {
        const res = await api.queryKeyframe({
          query: singleQuery,
          limit: Number(singleLimit),
          model: modelKeyframe as any,
        });
        results = res.results ?? [];
        totalCount = res.total ?? results.length;
      } else if (singleSearchMode === 'transcript_semantic') {
        const res = await api.queryTranscriptSemantic({
          query: singleQuery,
          limit: Number(singleLimit),
          model: 'gte',
        });
        results = res.results ?? [];
        totalCount = res.total ?? results.length;
      } else if (singleSearchMode === 'transcript_exact') {
        const res = await api.queryTranscriptExact({
          query: singleQuery,
          limit: Number(singleLimit),
          phrase: singlePhrase,
        });
        results = res.results ?? [];
        totalCount = res.total ?? results.length;
      } else if (singleSearchMode === 'ocr_exact') {
        const res = await api.queryOcr({
          query: singleQuery,
          limit: Number(singleLimit),
          phrase: singlePhrase,
        });
        results = res.results ?? [];
        totalCount = res.total ?? results.length;
      } else if (singleSearchMode === 'video_id') {
        const res = await api.listKeyframes(videoKeyframeId.trim());
        results = res.keyframes ?? [];
        totalCount = res.total ?? results.length;
      }
    } catch (err: any) {
      errorMessage = err.message || 'Search query failed';
    } finally {
      isSearching = false;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }
</script>

<div class="flex flex-col h-full bg-slate-50 overflow-hidden">
  <!-- Search Bar Header Section -->
  <div class="border-b-2 border-neutral-900 bg-white p-4 shadow-sm">
    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      class="flex w-full items-center overflow-hidden border-2 border-neutral-900 bg-blue-50 focus-within:ring-2 focus-within:ring-blue-600"
    >
      <!-- Dropdown Search Mode (Bits UI) -->
      <DropdownMenu.Root>
        <DropdownMenu.Trigger class="relative flex h-10 shrink-0 items-center gap-1.5 border-r-2 border-neutral-900 bg-slate-100 px-3 text-sm font-bold text-slate-800 hover:bg-slate-200 outline-none">
          <span>✨</span>
          <span>{modeLabel}</span>
          <span class="text-slate-500 ml-1">▾</span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content class="z-50 min-w-45 rounded bg-white p-1 shadow-lg border-2 border-neutral-900">
            {#each MODE_OPTIONS as opt}
              <DropdownMenu.Item
                class="flex items-center gap-2 px-3 py-2 rounded text-xs font-bold text-slate-800 hover:bg-blue-100 hover:text-blue-900 cursor-pointer outline-none"
                onclick={() => (singleSearchMode = opt.value)}
              >
                <span>{opt.label}</span>
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <!-- Model Chips -->
      {#if singleSearchMode === 'keyframe'}
        <div class="px-3 py-1 bg-blue-100 border-r-2 border-neutral-900 text-xs font-mono font-bold text-blue-900">
          <select bind:value={modelKeyframe} class="bg-transparent outline-none cursor-pointer">
            <option value="siglip">siglip</option>
            <option value="siglip2">siglip2</option>
            <option value="pe">pe</option>
          </select>
        </div>
      {/if}
      {#if singleSearchMode === 'transcript_semantic'}
        <div class="px-3 py-1 bg-blue-100 border-r-2 border-neutral-900 text-xs font-mono font-bold text-blue-900">
          {modelTranscriptSemantic}
        </div>
      {/if}

      <!-- Phrase Checkbox -->
      {#if singleSearchMode === 'ocr_exact' || singleSearchMode === 'transcript_exact'}
        <label class="ml-2 flex shrink-0 cursor-pointer items-center gap-1 border-2 border-neutral-900 bg-blue-100 px-2 py-1 text-xs font-bold text-blue-900">
          <input
            type="checkbox"
            class="h-3.5 w-3.5 accent-blue-700"
            bind:checked={singlePhrase}
          />
          <span>Phrase</span>
        </label>
      {/if}

      <!-- Text / Video ID Input -->
      {#if singleSearchMode === 'video_id'}
        <input
          class="h-10 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
          placeholder="Video ID (e.g. L01_V001)..."
          bind:value={videoKeyframeId}
          onkeydown={handleKeyDown}
        />
      {:else}
        <input
          class="h-10 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
          placeholder="Query: 'person riding a red bicycle'..."
          bind:value={singleQuery}
          onkeydown={handleKeyDown}
        />
      {/if}

      <!-- Filter Drawer Toggle -->
      <button
        type="button"
        onclick={() => (showFilterDrawer = !showFilterDrawer)}
        class={`flex h-10 w-10 shrink-0 items-center justify-center border-l-2 border-neutral-900 text-slate-600 hover:bg-slate-100 outline-none ${
          showFilterDrawer ? 'bg-blue-200 text-blue-800' : ''
        }`}
        title="Toggle Filters"
      >
        ⚙️
      </button>

      <!-- Submit Button -->
      <button
        type="submit"
        disabled={isSearching}
        class="flex h-10 w-14 shrink-0 items-center justify-center border-l-2 border-neutral-900 bg-blue-700 text-white hover:bg-blue-800 outline-none disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        {#if isSearching}
          <span class="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
        {:else}
          🔍
        {/if}
      </button>
    </form>

    <!-- Filter Drawer Panel -->
    {#if showFilterDrawer}
      <div class="mt-3 flex items-center gap-4 rounded border-2 border-neutral-900 bg-slate-100 p-3 text-xs font-bold">
        <label class="flex items-center gap-2">
          <span>Result Limit:</span>
          <input
            type="number"
            class="w-20 rounded border border-neutral-400 px-2 py-1 font-mono"
            bind:value={singleLimit}
            min="1"
            max="1000"
          />
        </label>
      </div>
    {/if}
  </div>

  <!-- Results Content Area -->
  <div class="flex-1 overflow-y-auto p-5">
    {#if errorMessage}
      <div class="mb-4 rounded border-2 border-rose-900 bg-rose-50 p-3 text-sm font-bold text-rose-800">
        Error: {errorMessage}
      </div>
    {/if}

    <div class="mb-3 flex items-center justify-between text-xs font-bold text-slate-600">
      <span>Total Results: {totalCount}</span>
    </div>

    {#if results.length === 0 && !isSearching}
      <div class="flex h-64 flex-col items-center justify-center text-slate-400">
        <p class="text-sm font-semibold">No results yet. Enter a query and hit search.</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {#each results as item}
          <div class="group relative flex flex-col overflow-hidden rounded border-2 border-neutral-900 bg-white shadow-sm hover:shadow-md transition-shadow">
            {#if 'keyframe_id' in item}
              <div class="aspect-video w-full bg-slate-200 overflow-hidden relative">
                <img
                  src={api.getKeyframeImageUrl(item.video_id, item.keyframe_id)}
                  alt={item.keyframe_id}
                  loading="lazy"
                  class="h-full w-full object-cover"
                />
              </div>
              <div class="p-2 text-xs">
                <div class="font-bold font-mono text-slate-900 truncate">{item.video_id}</div>
                <div class="text-slate-500 font-mono text-[10px]">
                  Frame: {item.frame_idx} ({Math.round(item.timestamp_ms / 1000)}s)
                </div>
                {#if item.score !== undefined && item.score !== null}
                  <div class="mt-1 font-mono text-[10px] text-blue-700 font-bold">
                    Score: {item.score.toFixed(3)}
                  </div>
                {/if}
              </div>
            {:else}
              <!-- Transcript / OCR grouped item -->
              <div class="p-3">
                <div class="font-bold font-mono text-slate-900 text-xs">{item.video_id}</div>
                <p class="mt-1 text-xs text-slate-700 line-clamp-3">{'text' in item ? item.text : ''}</p>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>