<script lang="ts">
  import {
    MagnifyingGlassIcon,
    PlusIcon,
    SlidersHorizontalIcon,
    BooksIcon,
    SparkleIcon,
    TargetIcon,
    TrashIcon
  } from "phosphor-svelte";
  import { BORDER_STYLE, ACCENT_PALETTES, PRESSED_ANIM } from "./common/CommonStyle";
  import MyDropdown from "./common/MyDropdown.svelte";
  import { multipleSearch, type EventItem } from "../lib/multipleSearchImpl.svelte";
  import { type TemporalItem, type CardItem } from "../lib/types";
  import { Toggle } from "bits-ui";
    import KeyframeCard from "./KeyframeCard.svelte";
    import VideoDialog from "./VideoDialog.svelte";
    import MyCheckbox from "./common/MyCheckbox.svelte";
    import MyInputbox from "./common/MyInputbox.svelte";

  const MODEL_OPTIONS = [
    { value: "siglip", label: "siglip" },
    { value: "siglip2", label: "siglip2" },
    { value: "pe", label: "pe" }
  ];

  const MODE_OPTIONS = [
    { value: 'semantic', label: 'Semantic', icon: SparkleIcon},
    { value: 'object_detect', label: 'Object Detection', icon: TargetIcon },
  ];

  const rose = ACCENT_PALETTES.rose;

  let selectedVideo = $state<CardItem | null>(null);
  let videoDialogOpen = $state(false);

  function openVideo(item: CardItem) {
    selectedVideo = item;
    videoDialogOpen = true;
  }

  let stageInputs: HTMLInputElement[] = [];

  function handleKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      multipleSearch.handleSearch();
    }

    if (event.key === "Tab") {
      const nextInput = event.shiftKey ? stageInputs[index - 1] : stageInputs[index + 1];
      if (nextInput) {
        event.preventDefault();
        nextInput.focus();
      }
    }
  }

  $inspect(multipleSearch.eventResults);
</script>

{#snippet sequenceDisplay(item: TemporalItem)}
  <div class="flex flex-col w-full gap-2 p-2 {BORDER_STYLE}">
    <header class="flex items-center justify-between gap-2">
      <span class="text-xl font-bold {rose.textDark}">{item.video_id}</span>
      <span class="text-xs text-slate-500 select-none">{item.rank}</span>
    </header>
    
    <div class="flex w-full min-w-0 overflow-x-auto gap-2 pb-2">
      {#each item.matches ?? [] as card (card.keyframe_id)}
        <div class="h-full shrink-0 w-96">
          <KeyframeCard
            item={card}
            accent="rose"
            bind:allowSubmit={multipleSearch.allowSingleSubmit}
            mode="semantic"
            watchVideo={openVideo}
            bind:qaAnswer={multipleSearch.qaAnswer}
          />
        </div>
      {/each}
    </div>
  </div>
{/snippet}

<!-- 0-based index! -->
{#snippet eventDisplay(index: number)}
  <section class="flex min-w-0 w-[50%] flex-col {BORDER_STYLE}">
    <header class="flex h-12 items-center justify-between border-b-2 border-slate-900 bg-slate-100 px-3">
      <div class="flex min-w-0 items-center gap-2">
        <span class="{rose.bg} {BORDER_STYLE} p-1 text-md font-bold text-white select-none">
          E{index + 1}
        </span>
        <p class="truncate font-semibold text-slate-800" title={multipleSearch.eventResults[index].query}>
          {multipleSearch.eventResults[index].query}
        </p>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
      {#each multipleSearch.eventResults[index].matches as card (`${card.video_id}-${card.keyframe_id}-${card.rank}`)}
        <KeyframeCard
          item={card}
          accent="rose"
          bind:allowSubmit={multipleSearch.allowSingleSubmit}
          mode="semantic"
          watchVideo={openVideo}
          bind:qaAnswer={multipleSearch.qaAnswer}
          lockedInLabel={`E${index + 1}`}
        />
      {/each}
    </div>
  </section>
{/snippet}

<div class="min-h-0 flex flex-1 flex-col">
  <div class="flex flex-col gap-2.5 p-2">
    <!-- Each search bar stage -->
    {#each multipleSearch.stages as stage, index (stage.id)}
      <div class="flex h-11 items-center {BORDER_STYLE} {rose.focusRing} bg-white">
        <div class="flex h-full w-12 shrink-0 items-center justify-center {rose.bgSubtle} {rose.text} border-r-2 border-slate-900 text-base font-mono font-bold select-none">
          E{index + 1}
        </div>

        <div class="flex min-w-0 flex-1 items-center gap-2 px-2">
          {#if multipleSearch.searchMode === 'semantic'}
          <MyDropdown
            items={MODEL_OPTIONS}
            bind:value={multipleSearch.semanticModel}
            accent="rose"
          />
          {/if}

          <input
            bind:this={stageInputs[index]}
            class="min-w-0 flex-1 bg-transparent px-1 text-lg font-medium text-slate-900 outline-none placeholder:text-slate-400"
            placeholder={`Describe event ${index + 1}...`}
            bind:value={stage.query}
            onkeydown={(event) => handleKeyDown(event, index)}
          />
        </div>

        <button
          type="button"
          title="Remove stage"
          disabled={multipleSearch.stages.length <= 2}
          onclick={() => multipleSearch.removeStage(stage.id)}
          class="flex h-full w-10 shrink-0 items-center justify-center {PRESSED_ANIM} border-slate-900 text-slate-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <TrashIcon size={18} />
        </button>
      </div>
    {/each}

    <!-- Control area -->
    <div class="flex justify-center w-full px-4">
      <div class="flex items-center justify-center gap-2 w-full">
        <!-- Mode Selection -->
        <MyDropdown items={MODE_OPTIONS} bind:value={multipleSearch.searchMode} width="w-40" height="h-10" accent="rose" strong={false}/>
        <!-- Single submit toggle -->
        <MyCheckbox label="Single submit" bind:checked={multipleSearch.allowSingleSubmit} accent="rose" height="h-10"/>
        <!-- Sequence / Event view: -->
        <Toggle.Root
          pressed={multipleSearch.sequenceView}
          onPressedChange={(p) => (multipleSearch.sequenceView = p)}
          class="flex h-10 w-36 shrink-0 items-center justify-center gap-1 p-2 {BORDER_STYLE} bg-slate-50 {rose.hoverSubtle} {PRESSED_ANIM} transition-all"
          title="Sequence / Event view"
        >
          {#if multipleSearch.sequenceView}
            <BooksIcon size="16px" weight="regular"/>
            <span class="text-sm font-semibold">Sequence view</span>
          {:else}
            <TargetIcon size="16px" weight="regular"/>
            <span class="text-sm font-semibold">Event view</span>
          {/if}
        </Toggle.Root>
        
        <!-- Add stage button -->
        <button
          type="button"
          onclick={() => multipleSearch.addStage()}
          class="flex h-10 w-32 items-center justify-center shrink-0 whitespace-nowrap gap-1 p-2 {PRESSED_ANIM} {BORDER_STYLE} border-dashed {rose.hoverSubtle} text-sm font-semibold transition-colors"
        >
          <PlusIcon size={18} />
          <span class="text-sm font-semibold">Add event</span>
        </button>
        
        <!-- Filter drawer toggle -->
        <Toggle.Root
          pressed={multipleSearch.showFilterDrawer}
          onPressedChange={(p) => (multipleSearch.showFilterDrawer = p)}
          class="flex h-10 w-30 shrink-0 items-center justify-center gap-1 {BORDER_STYLE} bg-slate-50 {rose.hoverSubtle} active:scale-[0.95] transition-all"
          title="Toggle Filters"
        >
          <SlidersHorizontalIcon size="24px" weight="regular"/>
          <span class="text-sm font-semibold">Config</span>
        </Toggle.Root>

        <!-- Search button -->
         <button
          type="submit"
          disabled={multipleSearch.isSearching}
          onclick={() => multipleSearch.handleSearch()}
          class="flex h-10 w-30 shrink-0 items-center justify-center {BORDER_STYLE} text-white {rose.hover} {rose.bg} outline-none active:scale-[0.95] transition-all"
        >
          {#if multipleSearch.isSearching}
            <span class="h-4 w-4 animate-spin border-2 border-white border-t-transparent"></span>
          {:else}
            <MagnifyingGlassIcon size="24px" weight="regular"/>
            <span class="text-sm font-semibold">Search</span>
          {/if}
        </button>
        
      </div>
    </div>

    <!-- Filter Drawer Content -->
    {#if multipleSearch.showFilterDrawer}
      <div class="flex items-left gap-2 p-2 m-8 mt-0 {BORDER_STYLE} bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-all">
        <MyInputbox type="number" label="Limit" bind:value={multipleSearch.limit} min="1" max="1000" width="w-1/8" height="h-10" accent="rose" layout="vertical"/>
        <MyInputbox type="text" label="Exclusion" bind:value={multipleSearch.exclusion} width="w-5/8" height="h-10" accent="rose" layout="vertical"/>
      </div>
    {/if}

    <!-- Sequence results -->
    {#if multipleSearch.isSearching}
      <div class="p-4 text-center text-slate-500">
        Searching...
      </div>
    {:else if multipleSearch.sequenceResults.length === 0}
      <div class="p-4 text-center text-slate-400">
        No results.
      </div>
    {:else}
      {#if multipleSearch.sequenceView}
        <div class="flex flex-col gap-4 px-2 pb-4">
          {#each multipleSearch.sequenceResults as item (`${item.video_id}-${item.rank}-${item.score}`)}
            {@render sequenceDisplay(item)}
          {/each}
        </div>
      {:else}
        {#if multipleSearch.eventResults.length > 2}
          <div class="flex items-center justify-center gap-2 p-2">
            <button
              type="button"
              class="{BORDER_STYLE} {PRESSED_ANIM} px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={multipleSearch.eventViewIndex === 0}
              onclick={() => multipleSearch.eventViewIndex--}
            >
              Previous
            </button>

            <button
              type="button"
              class="{BORDER_STYLE} {PRESSED_ANIM} px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={multipleSearch.eventViewIndex === multipleSearch.eventViewIndexMax}
              onclick={() => multipleSearch.eventViewIndex++}
            >
              Next
            </button>
          </div>
        {/if}
        
        <div class="flex gap-2 p-2">
          {@render eventDisplay(multipleSearch.eventViewIndex)}
          {@render eventDisplay(multipleSearch.eventViewIndex + 1)}
        </div>
      {/if}
    {/if}

    {#if multipleSearch.errorMessage}
      <div class="mb-4 {BORDER_STYLE} bg-rose-100 p-4 text-sm font-semibold text-rose-800">
        Error: {multipleSearch.errorMessage}
      </div>
    {/if}

  </div>
</div>

<VideoDialog
  bind:open={videoDialogOpen}
  item={selectedVideo}
  bind:qaAnswer={multipleSearch.qaAnswer}
  accent="rose"
/>