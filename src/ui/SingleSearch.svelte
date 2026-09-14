<script lang="ts">
  import { Select, Toggle, Checkbox, Label, Pagination, Collapsible } from 'bits-ui';
  import { singleSearch } from '../lib/singleSearchImpl.svelte';
  import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
  import Gear from 'phosphor-svelte/lib/Gear';
  import MyDropdown from './common/MyDropdown.svelte';
  import MyCheckbox from './common/MyCheckbox.svelte';
  import KeyframeCard from './KeyframeCard.svelte';

  const MODE_OPTIONS = [
    { value: 'semantic', label: '✨ Semantic' },
    { value: 'transcript', label: '📄 Transcript' },
    { value: 'ocr', label: '🔍 OCR' },
    { value: 'video_id', label: '📺 Video ID' },
  ];

  const MODEL_OPTIONS = [
    { value: 'siglip', label: 'siglip' },
    { value: 'siglip2', label: 'siglip2' },
    { value: 'pe', label: 'pe' },
  ];

  const BORDER_STYLE = "rounded border-2 border-slate-900";

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      singleSearch.handleSearch();
    }
  }

  $inspect(singleSearch.searchMode)
</script>

<div class="min-h-0 flex flex-col overflow-y-auto">
  <!-- Search bar  -->
  <div class="flex justify-center-safe gap-1 p-4 border-b border-slate-50">
    <!-- Mode Selection -->
    <MyDropdown items={MODE_OPTIONS} bind:value={singleSearch.searchMode} width="w-36" height="h-11" accent="blue" strong={true}/>

    <!-- Input field -->
    <div class="inline-flex w-full items-center overflow-hidden {BORDER_STYLE} focus-within:ring-1 px-2 gap-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-all">
      
      {#if singleSearch.searchMode === 'semantic'}
        <MyDropdown items={MODEL_OPTIONS} bind:value={singleSearch.modelSemantic} accent="blue"/>
      {:else if singleSearch.searchMode === 'transcript'}
        <MyCheckbox label="Exact" bind:checked={singleSearch.isTranscriptExact}/>
        {#if singleSearch.isTranscriptExact}
          <MyCheckbox label="Phrase" bind:checked={singleSearch.isSearchPhrase}/>
        {/if}
      {/if}
      <input
        class="h-10 min-w-0 flex-1 px-2 bg-transparent text-lg font-medium text-slate-900 placeholder:text-slate-400 outline-none"
        placeholder="Query: 'person riding a red bicycle'..."
        bind:value={singleSearch.query}
        onkeydown={handleKeyDown}
      />
    </div>

    <!-- Filter Drawer -->
    <Toggle.Root
      pressed={singleSearch.showFilterDrawer}
      onPressedChange={(p) => (singleSearch.showFilterDrawer = p)}
      class="flex h-11 w-11 shrink-0 items-center justify-center {BORDER_STYLE} bg-slate-50 hover:bg-blue-100 text-slate-600 active:scale-[0.95] transition-all"
      title="Toggle Filters"
    >
      <Gear class="size-lg" weight="bold"/>
    </Toggle.Root>

    <!-- Submit Button -->
    <button
      type="submit"
      disabled={singleSearch.isSearching}
      class="flex h-11 w-11 shrink-0 items-center justify-center {BORDER_STYLE} bg-blue-600 text-white hover:bg-blue-700 outline-none active:scale-[0.95] transition-all"
    >
      {#if singleSearch.isSearching}
        <span class="h-4 w-4 animate-spin border-2 border-white border-t-transparent"></span>
      {:else}
        <MagnifyingGlass class="size-lg" weight="bold"/>
      {/if}
    </button>
    
  </div>

  <!-- Filter Drawer Content -->
  {#if singleSearch.showFilterDrawer}
    <div class="mt-3 flex items-center gap-4 border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700 shadow-sm animate-fadeIn">
      <label class="flex items-center gap-2">
        <span>Result Limit:</span>
        <input
          type="number"
          class="w-24 border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          bind:value={singleSearch.limit}
          min="1"
          max="1000"
        />
      </label>
    </div>
  {/if}

  <!-- Results Content Area -->
  <div class="flex flex-1 p-4 flex-col justify-between">
    <div>
      {#if singleSearch.errorMessage}
        <div class="mb-4 border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 shadow-sm">
          Error: {singleSearch.errorMessage}
        </div>
      {/if}

      <div class="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500 select-none">
        <span>Total Results: {singleSearch.results.length}</span>
        {@render paginationControl()}
      </div>

      {#if singleSearch.results.length === 0 && !singleSearch.isSearching}
        <div class="flex h-64 flex-col items-center justify-center text-slate-400 opacity-60 select-none">
          <p class="text-sm font-semibold">No results.</p>
        </div>
      {:else}
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {#each singleSearch.paginatedResults as item}
            <KeyframeCard
              {item}
              onWatchVideo={(item) => {
                console.log('Watch video', item);
              }}
            />
          {/each}
        </div>
      {/if}
    </div>

    <!-- Pagination -->
    <div class="border-slate-200 mt-8 flex justify-center">
      {@render paginationControl()}
    </div>
  </div>
</div>

{#snippet paginationControl()}
  {#if singleSearch.results.length > singleSearch.pageSize}
  <Pagination.Root
    count={singleSearch.results.length}
    perPage={singleSearch.pageSize}
    page={singleSearch.currentPage}
    onPageChange={(p) => (singleSearch.currentPage = p)}
  >
    {#snippet children({ pages, range })}
      <div class="flex items-center gap-2">
        <Pagination.PrevButton class="px-3 py-1 {BORDER_STYLE} bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.95] transition-all">
          Prev
        </Pagination.PrevButton>
        
        {#each pages as page (page.key)}
          {#if page.type === 'ellipsis'}
            <span class="px-2 text-slate-400 text-xs">...</span>
          {:else}
            <Pagination.Page
              {page}
              class={`px-3 py-1 ${BORDER_STYLE} active:scale-[0.95] transition-all text-xs font-semibold ${
                singleSearch.currentPage === page.value
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {page.value}
            </Pagination.Page>
          {/if}
        {/each}

        <Pagination.NextButton class="px-3 py-1 {BORDER_STYLE} bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.95] transition-all">
          Next
        </Pagination.NextButton>
      </div>
    {/snippet}
  </Pagination.Root>
  {/if}
{/snippet}