<script lang="ts">
  import { Toggle, Pagination } from 'bits-ui';
  import { singleSearch } from '../lib/singleSearchImpl.svelte';
  import { appState } from '../lib/appState.svelte';
  import {
    SparkleIcon,
    ArticleIcon,
    ScanIcon,
    TelevisionIcon,
    MagnifyingGlassIcon,
    SlidersHorizontalIcon,
    TrashIcon,
    TildeIcon,
  } from 'phosphor-svelte';
  import { BORDER_STYLE, ACCENT_PALETTES } from './common/CommonStyle';
  import MyDropdown from './common/MyDropdown.svelte';
  import MyCheckbox from './common/MyCheckbox.svelte';
  import MyInputbox from './common/MyInputbox.svelte';
  import KeyframeCard from './KeyframeCard.svelte';
  import VideoDialog from './VideoDialog.svelte';
  import type { CardItem, Item } from '../lib/types';

  const MODE_OPTIONS = [
    { value: 'semantic', label: 'Semantic', icon: SparkleIcon, search_placeholder: "Query: 'person riding a red bicycle'..." },
    { value: 'transcript', label: 'Transcript', icon: ArticleIcon, search_placeholder: "Query: 'add 2 tbps of sugar'..." },
    { value: 'ocr', label: 'OCR', icon: ScanIcon, search_placeholder: "Query: 'text in the image'..." },
    { value: 'video_id', label: 'Video ID', icon: TelevisionIcon, search_placeholder: "Video ID (eg. L21_V005)" },
  ];

  const MODEL_OPTIONS = [
    { value: 'siglip', label: 'siglip' },
    { value: 'siglip2', label: 'siglip2' },
    { value: 'pe', label: 'pe' },
  ];

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      singleSearch.handleSearch();
    }
  }

  let selectedVideo = $state<CardItem | null>(null);
  let videoDialogOpen = $state(false);

  function openVideo(item: CardItem) {
    selectedVideo = item;
    videoDialogOpen = true;
  }


  // $inspect(singleSearch.searchMode)
</script>

<div class="min-h-0 flex flex-1 flex-col">
  <!-- Search bar  -->
  <div class="flex gap-1 p-2">
    <!-- Mode Selection -->
    <MyDropdown items={MODE_OPTIONS} bind:value={singleSearch.searchMode} width="w-36" height="h-11" accent="blue" strong={true}/>

    <!-- Input field -->
    <div class="inline-flex w-full items-center overflow-hidden {BORDER_STYLE} {ACCENT_PALETTES.blue.focusRing} px-2 gap-2 transition-all">
      
      {#if singleSearch.searchMode === 'semantic'}
        <MyDropdown items={MODEL_OPTIONS} bind:value={singleSearch.modelSemantic} width="w-24" accent="blue"/>
      {:else if singleSearch.searchMode === 'transcript'}
        <MyCheckbox label="Exact" bind:checked={singleSearch.isTranscriptExact}/>
      {/if}
      {#if singleSearch.isTranscriptExact || singleSearch.searchMode === 'ocr'}
        <MyCheckbox label="Phrase" bind:checked={singleSearch.isSearchPhrase}/>
      {/if}
      <input
        class="h-10 min-w-0 flex-1 px-2 bg-transparent text-lg font-medium text-slate-900 placeholder:text-slate-400 outline-none"
        placeholder={MODE_OPTIONS.find((o) => o.value === singleSearch.searchMode)?.search_placeholder}
        bind:value={singleSearch.query}
        onkeydown={handleKeyDown}
      />
    </div>

    <!-- Filter Drawer Toggle -->
    <Toggle.Root
      pressed={singleSearch.showFilterDrawer}
      onPressedChange={(p) => (singleSearch.showFilterDrawer = p)}
      class="flex h-11 w-11 shrink-0 items-center justify-center {BORDER_STYLE} bg-slate-50 hover:bg-blue-100 text-slate-600 active:scale-[0.95] transition-all"
      title="Toggle Filters"
    >
      <SlidersHorizontalIcon size="24px" weight="regular"/>
    </Toggle.Root>

    <!-- Search Button -->
    <button
      type="submit"
      disabled={singleSearch.isSearching}
      onclick={() => singleSearch.handleSearch()}
      class="flex h-11 w-11 shrink-0 items-center justify-center {BORDER_STYLE} bg-blue-600 text-white hover:bg-blue-700 outline-none active:scale-[0.95] transition-all"
    >
      {#if singleSearch.isSearching}
        <span class="h-4 w-4 animate-spin border-2 border-white border-t-transparent"></span>
      {:else}
        <MagnifyingGlassIcon size="24px" weight="regular"/>
      {/if}
    </button>
    
  </div>

  <!-- Filter Drawer Content -->
  {#if singleSearch.showFilterDrawer}
    <div class="mx-2 mb-2 flex items-left gap-2 p-3 {BORDER_STYLE} bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-all">
      {#if singleSearch.searchMode === 'video_id'}
        <MyInputbox type="number" label="Start time (ms)" bind:value={singleSearch.videoStartMs} width="w-1/2" height="h-10" accent="blue" layout="horizontal"/>
        <MyInputbox type="number" label="End time (ms)" bind:value={singleSearch.videoEndMs} width="w-1/2" height="h-10" accent="blue" layout="horizontal"/>
      {:else}
        <MyInputbox type="number" label="Limit" bind:value={singleSearch.limit} min="1" max="1000" width="w-1/8" height="h-10" accent="blue" layout="horizontal"/>
        <MyInputbox type="text" label="Exclusion" bind:value={singleSearch.exclusion} width="w-5/8" height="h-10" accent="blue" layout="horizontal"/>
        <MyInputbox type="text" label="Similar frame" bind:value={singleSearch.similarFrame} width="w-2/8" height="h-10" accent="blue" layout="horizontal" disabled={true}/>
      {/if}
    </div>
  {/if}

  <!-- Results Area -->
  <div class="flex flex-1 p-2 flex-col justify-between">
    <div>
      {#if singleSearch.errorMessage}
        <div class="mb-4 {BORDER_STYLE} bg-rose-100 p-4 text-sm font-semibold text-rose-800">
          Error: {singleSearch.errorMessage}
        </div>
      {/if}
      
      <!-- Head: total & pagination -->
      <div class="mb-3 flex items-center justify-between text-sm font-semibold text-slate-500 select-none">
        <span>Total Results: {singleSearch.results.length}</span>
        {@render paginationControl()}
      </div>

      <!-- Results Grid -->
      {#if singleSearch.results.length === 0 && !singleSearch.isSearching}
        <div class="flex h-64 flex-col items-center justify-center text-slate-400 opacity-60 select-none">
          <p class="text-sm font-semibold">No results.</p>
        </div>
      {:else}
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {#each singleSearch.paginatedResults as item, index (
            `${item.video_id}-${item.keyframe_id}-${index}`    // Key the card
          )}
            <KeyframeCard
              {item}
              type="single"
              mode={singleSearch.searchMode}
              qaEnabled={appState.qaEnabled}
              bind:qaAnswer={singleSearch.qaAnswer}
              watchVideo={openVideo}
              actions={[
                {
                  id: 'exclude-vid',
                  label: 'Exclude video',
                  icon: TrashIcon,
                  class: 'text-rose-700 hover:bg-rose-100 hover:text-rose-900',
                  run: (currentItem) => {
                    singleSearch.exclusion = `${singleSearch.exclusion},${currentItem.video_id}`;
                  }
                },
                {
                  id: 'exclude-frame',
                  label: 'Exclude frame',
                  icon: TrashIcon,
                  class: 'text-rose-700 hover:bg-rose-100 hover:text-rose-900',
                  run: (currentItem) => {
                    singleSearch.exclusion = `${singleSearch.exclusion},${currentItem.video_id}-${currentItem.keyframe_id}`;
                  }
                },
                {
                  id: 'similar',
                  label: 'Similar keyframes',
                  disabled: true,
                  icon: TildeIcon,
                  class: 'text-blue-700 hover:bg-blue-100 hover:text-blue-900',
                  run: (currentItem) => {
                    singleSearch.handleSimilarFrame(
                      currentItem.video_id,
                      currentItem.keyframe_id
                    );
                  }
                }
              ]}
            />
          {/each}
        </div>
      {/if}
    </div>
  </div>
  <!-- Pagination -->
  <div class="flex justify-center mt-2 pb-6">
    {@render paginationControl()}
  </div>
</div>

<VideoDialog
  bind:open={videoDialogOpen}
  item={selectedVideo}
  bind:qaAnswer={singleSearch.qaAnswer}
  accent="blue"
/>

{#snippet paginationControl()}
  {#if singleSearch.results.length > singleSearch.pageSize}
  <Pagination.Root
    count={singleSearch.results.length}
    perPage={singleSearch.pageSize}
    bind:page={singleSearch.currentPage}
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