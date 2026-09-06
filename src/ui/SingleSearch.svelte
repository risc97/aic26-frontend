<script lang="ts">
  import { Select, Toggle, Checkbox, Label, Pagination } from 'bits-ui';
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

  // Pagination state
  let currentPage = $state(1);
  let pageSize = $state(24); // items per page

  // Results & Loading state
  let isSearching = $state(false);
  let errorMessage = $state<string | null>(null);
  let results = $state<(Item | TranscriptItem | OcrItem)[]>([]);
  let totalCount = $state(0);

  // Paginated slice
  let paginatedResults = $derived(
    results.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  );

  const MODE_OPTIONS = [
    { value: 'keyframe', label: 'Semantic' },
    { value: 'transcript_semantic', label: 'Transcript' },
    { value: 'transcript_exact', label: 'Transcript Exact' },
    { value: 'ocr_exact', label: 'OCR' },
    { value: 'video_id', label: 'Video ID' },
  ];

  let currentModeObj = $derived(MODE_OPTIONS.find((o) => o.value === singleSearchMode));
  let modeLabel = $derived(currentModeObj?.label || 'Semantic');

  const MODEL_OPTIONS = [
    { value: 'siglip', label: 'siglip' },
    { value: 'siglip2', label: 'siglip2' },
    { value: 'pe', label: 'pe' },
  ];

  async function handleSearch() {
    isSearching = true;
    errorMessage = null;
    results = [];
    totalCount = 0;
    currentPage = 1; // Reset to first page on new search

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

<div class="flex flex-col h-full min-h-full bg-slate-50 overflow-hidden">
  <div class="bg-white p-4 shadow-sm border-b border-slate-200">
    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      class="flex w-full items-center overflow-hidden border border-slate-300 bg-slate-50 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"
    >
      <!-- Mode Selection via Bits UI Select -->
      <Select.Root
        type="single"
        value={singleSearchMode}
        onValueChange={(v) => { if (v) singleSearchMode = v; }}
      >
        <Select.Trigger class="flex h-11 items-center gap-2 border-r border-slate-200 bg-slate-100/70 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-200/70 outline-none">
          <span>✨</span>
          <Select.Value>{modeLabel}</Select.Value>
          <span class="text-slate-400 text-xs ml-1">▾</span>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content class="z-50 min-w-48 bg-white p-1 shadow-xl border border-slate-200">
            {#each MODE_OPTIONS as opt}
              <Select.Item
                value={opt.value}
                class="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer outline-none transition-colors"
              >
                {opt.label}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      <!-- Keyframe Model Selector via Bits UI Select -->
      {#if singleSearchMode === 'keyframe'}
        <div class="flex items-center border-r border-slate-200 bg-blue-50/50 px-3">
          <Select.Root
            type="single"
            value={modelKeyframe}
            onValueChange={(v) => { if (v) modelKeyframe = v; }}
          >
            <Select.Trigger class="flex items-center gap-1 text-xs font-mono font-semibold text-blue-800 outline-none hover:opacity-80">
              <Select.Value>{modelKeyframe}</Select.Value>
              <span class="text-xs opacity-60">▾</span>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content class="z-50 min-w-28 bg-white p-1 shadow-lg border border-slate-200">
                {#each MODEL_OPTIONS as mod}
                  <Select.Item
                    value={mod.value}
                    class="px-3 py-1.5 text-xs font-mono font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer outline-none"
                  >
                    {mod.label}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      {/if}

      {#if singleSearchMode === 'transcript_semantic'}
        <div class="px-3 border-r border-slate-200 text-xs font-mono font-semibold text-slate-600 bg-slate-50">
          {modelTranscriptSemantic}
        </div>
      {/if}

      <!-- Phrase Checkbox & Label Combo -->
      {#if singleSearchMode === 'ocr_exact' || singleSearchMode === 'transcript_exact'}
        <div class="ml-3 flex items-center gap-2">
          <Checkbox.Root
            id="phrase-checkbox"
            bind:checked={singlePhrase}
            class="peer h-4 w-4 shrink-0 border border-slate-300 bg-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            {#snippet children({ checked })}
              {#if checked}
                <span class="text-[10px] font-bold">✓</span>
              {/if}
            {/snippet}
          </Checkbox.Root>
          <Label.Root for="phrase-checkbox" class="text-xs font-medium text-slate-700 cursor-pointer select-none">
            Phrase
          </Label.Root>
        </div>
      {/if}

      <!-- Text / Video ID Input -->
      {#if singleSearchMode === 'video_id'}
        <input
          class="h-11 min-w-0 flex-1 bg-transparent px-4 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
          placeholder="Video ID (e.g. L01_V001)..."
          bind:value={videoKeyframeId}
          onkeydown={handleKeyDown}
        />
      {:else}
        <input
          class="h-11 min-w-0 flex-1 bg-transparent px-4 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
          placeholder="Query: 'person riding a red bicycle'..."
          bind:value={singleQuery}
          onkeydown={handleKeyDown}
        />
      {/if}

      <!-- Filter Drawer Toggle using Bits UI Toggle -->
      <Toggle.Root
        pressed={showFilterDrawer}
        onPressedChange={(p) => (showFilterDrawer = p)}
        class={`flex h-11 w-11 shrink-0 items-center justify-center border-l border-slate-200 text-slate-600 hover:bg-slate-100 outline-none transition-colors ${
          showFilterDrawer ? 'bg-blue-100 text-blue-700 font-bold' : ''
        }`}
        title="Toggle Filters"
      >
        ⚙️
      </Toggle.Root>

      <!-- Submit Button -->
      <button
        type="submit"
        disabled={isSearching}
        class="flex h-11 w-14 shrink-0 items-center justify-center border-l border-slate-200 bg-blue-600 text-white hover:bg-blue-700 outline-none disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
      >
        {#if isSearching}
          <span class="h-4 w-4 animate-spin border-2 border-white border-t-transparent" />
        {:else}
          🔍
        {/if}
      </button>
    </form>

    <!-- Filter Drawer Panel -->
    {#if showFilterDrawer}
      <div class="mt-3 flex items-center gap-4 border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700 shadow-sm animate-fadeIn">
        <label class="flex items-center gap-2">
          <span>Result Limit:</span>
          <input
            type="number"
            class="w-24 border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={singleLimit}
            min="1"
            max="1000"
          />
        </label>
      </div>
    {/if}
  </div>

  <!-- Results Content Area -->
  <div class="flex-1 overflow-y-auto p-5 flex flex-col justify-between">
    <div>
      {#if errorMessage}
        <div class="mb-4 border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 shadow-sm">
          Error: {errorMessage}
        </div>
      {/if}

      <div class="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500 select-none">
        <span>Total Results: {totalCount}</span>
        {#if results.length > 0}
          <span>Page {currentPage} of {Math.ceil(results.length / pageSize) || 1}</span>
        {/if}
      </div>

      {#if results.length === 0 && !isSearching}
        <div class="flex h-64 flex-col items-center justify-center text-slate-400 opacity-60 select-none">
          <p class="text-sm font-semibold">No results.</p>
        </div>
      {:else}
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {#each paginatedResults as item}
            <div class="group relative flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
              {#if 'keyframe_id' in item}
                <div class="aspect-video w-full bg-slate-100 overflow-hidden relative">
                  <img
                    src={api.getKeyframeImageUrl(item.video_id, item.keyframe_id)}
                    alt={item.keyframe_id}
                    loading="lazy"
                    class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div class="p-2.5 text-xs">
                  <div class="font-bold font-mono text-slate-800 truncate">{item.video_id}</div>
                  <div class="text-slate-500 font-mono text-[10px] mt-0.5">
                    Frame: {item.frame_idx} ({Math.round(item.timestamp_ms / 1000)}s)
                  </div>
                  {#if item.score !== undefined && item.score !== null}
                    <div class="mt-1 font-mono text-[10px] text-blue-600 font-bold">
                      Score: {item.score.toFixed(3)}
                    </div>
                  {/if}
                </div>
              {:else}
                <!-- Transcript / OCR grouped item -->
                <div class="p-3.5">
                  <div class="font-bold font-mono text-slate-800 text-xs">{item.video_id}</div>
                  <p class="mt-1.5 text-xs text-slate-600 line-clamp-3 leading-relaxed">{'text' in item ? item.text : ''}</p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Bits UI Pagination Component -->
    {#if results.length > pageSize}
      <div class="mt-6 pt-4 border-t border-slate-200 flex justify-center">
        <Pagination.Root
          count={results.length}
          perPage={pageSize}
          page={currentPage}
          onPageChange={(p) => (currentPage = p)}
        >
          {#snippet children({ pages, range })}
            <div class="flex items-center gap-1">
              <Pagination.PrevButton class="px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                Prev
              </Pagination.PrevButton>
              
              {#each pages as page (page.key)}
                {#if page.type === 'ellipsis'}
                  <span class="px-2 text-slate-400 text-xs">...</span>
                {:else}
                  <Pagination.Page
                    {page}
                    class={`px-3 py-1.5 border text-xs font-semibold transition-colors ${
                      currentPage === page.value
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page.value}
                  </Pagination.Page>
                {/if}
              {/each}

              <Pagination.NextButton class="px-3 py-1.5 border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                Next
              </Pagination.NextButton>
            </div>
          {/snippet}
        </Pagination.Root>
      </div>
    {/if}
  </div>
</div>