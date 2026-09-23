<script lang="ts">
  import {
    MagnifyingGlassIcon,
    PlusIcon,
    SlidersHorizontalIcon,
    BooksIcon,
    SparkleIcon,
    TargetIcon,
    TrashIcon,
    LockIcon,
    LockOpenIcon,
    ArrowLineUpIcon,
    AirplaneTakeoffIcon,
  } from "phosphor-svelte";
  import { BORDER_STYLE, ACCENT_PALETTES, PRESSED_ANIM } from "./common/CommonStyle";
  import MyDropdown from "./common/MyDropdown.svelte";
  import { multipleSearch, type EventItem } from "../lib/multipleSearchImpl.svelte";
  import { type TemporalItem, type CardItem, type TemporalMatch } from "../lib/types";
  import { Pagination, Toggle } from "bits-ui";
    import KeyframeCard from "./KeyframeCard.svelte";
    import VideoDialog from "./VideoDialog.svelte";
    import MyCheckbox from "./common/MyCheckbox.svelte";
    import MyInputbox from "./common/MyInputbox.svelte";
    import { reviewQueue, type TrakeReviewItem } from "../lib/reviewQueue.svelte";

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

  let stageInputs = $state<HTMLInputElement[]>([]);

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

  let paginatedSequenceResults = $derived(
    multipleSearch.sequenceResults.slice(
      (multipleSearch.sequencePage - 1) * multipleSearch.sequencePageSize,
      multipleSearch.sequencePage * multipleSearch.sequencePageSize
    )
  );

  function buildTrakeReviewItem(matches: TemporalMatch[]): TrakeReviewItem {
    let videoId = matches[0].video_id;
    let frameIndexArray = matches.map(match => match.frame_idx);
    return {
      videoId,
      frameIndexArray,
      answer: multipleSearch.qaAnswer || undefined
    };
  };

  // $inspect(multipleSearch.eventFrameLockArray, "Event Frame Lock Array");
  // $inspect(multipleSearch.eventLockedVideoId, "Event Locked Video ID");
  $inspect(multipleSearch.sequenceResults, "Sequence Results");
</script>

{#snippet trakeSubmitControlGroup(items: TemporalMatch[])}
<div class="flex items-center gap-2">
  <button
    type="button"
    class="flex items-center justify-center p-1 gap-1 {BORDER_STYLE} {ACCENT_PALETTES.emerald.hoverSubtle} text-sm font-bold {PRESSED_ANIM}"
    onclick={() => {
      const reviewItem: TrakeReviewItem = buildTrakeReviewItem(items);
      reviewQueue.addTop(reviewItem);
    }}
  >
    <ArrowLineUpIcon size="14px" weight="bold" />
    <span class="hidden xl:inline">Add top</span>
  </button>

  <button
    type="button"
    class="flex items-center justify-center p-1 gap-1 {BORDER_STYLE} {ACCENT_PALETTES.emerald.hoverSubtle} text-sm font-bold {PRESSED_ANIM}"
    onclick={() => {
      const reviewItem: TrakeReviewItem = buildTrakeReviewItem(items);
      reviewQueue.add(reviewItem);
    }}
  >
    <PlusIcon size="14px" weight="bold" />
    <span class="hidden xl:inline">Add</span>
  </button>

  <button
    type="button"
    class="flex items-center justify-center p-1 gap-1 {BORDER_STYLE} {ACCENT_PALETTES.amber.bg} {ACCENT_PALETTES.amber.hover} text-slate-100 text-sm font-bold {PRESSED_ANIM}"
    onclick={() => console.log('Departure!')}
  >
    <AirplaneTakeoffIcon size="14px" weight="bold" />
    <span class="hidden xl:inline">Submit</span>
  </button>
</div>
{/snippet}

{#snippet sequencePaginationControl()}
  {#if multipleSearch.sequenceResults.length > multipleSearch.sequencePageSize}
    <Pagination.Root
      count={multipleSearch.sequenceResults.length}
      perPage={multipleSearch.sequencePageSize}
      bind:page={multipleSearch.sequencePage}
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
                  multipleSearch.sequencePage === page.value
                    ? 'border-rose-600 bg-rose-600 text-white'
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

{#snippet sequenceDisplay(item: TemporalItem)}
  <div class="flex flex-col w-full gap-2 p-2 {BORDER_STYLE}">
    <header class="flex items-center justify-between gap-2">
      <div class="flex gap-4 p-2">
        <span class="text-xl font-bold {rose.textDark}">{item.video_id}</span>
        <div class="text-sm font-semibold select-none {BORDER_STYLE} {ACCENT_PALETTES.amber.bgSubtle} {ACCENT_PALETTES.amber.textDark} h-7 p-0.5">
          {item.score.toFixed(4)}
        </div>
      </div>
      {#if item.matches && item.matches.length == multipleSearch.stages.length}
      {@render trakeSubmitControlGroup(item.matches)}
      {/if}
    </header>
    
    <div class="flex w-full min-w-0 overflow-x-auto gap-2 pb-2">
      {#each item.matches ?? [] as card (`${card.video_id}-${card.keyframe_id}`)}
        <div class="h-full shrink-0 w-96">
          <KeyframeCard
            item={card}
            accent="rose"
            bind:allowSubmit={multipleSearch.allowSingleSubmit}
            mode="semantic"
            watchVideo={openVideo}
            showFullKeyframe={true}
            bind:qaAnswer={multipleSearch.qaAnswer}
            actions={[
              {
                id: 'exclude-video',
                label: `Exclude video ${card.video_id}`,
                icon: TrashIcon,
                class: 'text-rose-700 hover:bg-rose-100 hover:text-rose-900',
                run: (currentItem) => {
                  multipleSearch.exclusion = `${multipleSearch.exclusion},${currentItem.video_id}`;
                }
              },
              {
                id: 'exclude-frame',
                label: `Exclude frame ${card.video_id}-${card.keyframe_id}`,
                icon: TrashIcon,
                class: 'text-rose-700 hover:bg-rose-100 hover:text-rose-900',
                run: (currentItem) => {
                  multipleSearch.exclusion = `${multipleSearch.exclusion},${currentItem.video_id}-${currentItem.keyframe_id}`;
                }
              }
            ]}
          />
        </div>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet eventPaginationControl(index: number)}
  {@const totalMatches = multipleSearch.eventResults[index].matches.length}
  {#if totalMatches > multipleSearch.eventPageSize}
    <Pagination.Root
      count={totalMatches}
      perPage={multipleSearch.eventPageSize}
      page={multipleSearch.eventPages[index] ?? 1}
      onPageChange={(p) => (multipleSearch.eventPages[index] = p)}
    >
      {#snippet children({ pages })}
        <div class="flex items-center gap-1">
          <Pagination.PrevButton class="px-2 py-1 {BORDER_STYLE} bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
            Prev
          </Pagination.PrevButton>
          
          {#each pages as page (page.key)}
            {#if page.type === 'ellipsis'}
              <span class="px-1 text-slate-400 text-xs">...</span>
            {:else}
              <Pagination.Page
                {page}
                class={`px-2.5 py-1 ${BORDER_STYLE} text-xs font-semibold ${
                  (multipleSearch.eventPages[index] ?? 1) === page.value
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {page.value}
              </Pagination.Page>
            {/if}
          {/each}

          <Pagination.NextButton class="px-2 py-1 {BORDER_STYLE} bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
            Next
          </Pagination.NextButton>
        </div>
      {/snippet}
    </Pagination.Root>
  {/if}
{/snippet}

<!-- 0-based index! -->
{#snippet eventDisplay(index: number)}
  {@const currentPage = multipleSearch.eventPages[index] ?? 1}
  {@const allMatches = multipleSearch.eventResults[index].matches}
  {@const paginatedMatches = allMatches.slice(
    (currentPage - 1) * multipleSearch.eventPageSize,
    currentPage * multipleSearch.eventPageSize
  )}

  <section class="flex min-w-0 w-[50%] flex-col {BORDER_STYLE}">
    <header class="flex h-12 items-center justify-between border-b-2 border-slate-900 bg-slate-100 px-3">
      <div class="flex min-w-0 items-center gap-2 flex-1">
        <span class="{rose.bg} {BORDER_STYLE} p-1 text-md font-bold text-white select-none">
          E{index + 1}
        </span>
        <p class="truncate font-semibold text-slate-800" title={multipleSearch.eventResults[index].query}>
          {multipleSearch.eventResults[index].query}
        </p>
      </div>
      <div>
        {@render eventPaginationControl(index)}
      </div>
    </header>

    <div class="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
      {#each paginatedMatches as card (`${card.video_id}-${card.keyframe_id}-${card.rank}`)}
        {@const isLockedHere = multipleSearch.eventFrameLockArray[index]?.keyframe_id === card.keyframe_id && 
                               multipleSearch.eventFrameLockArray[index]?.video_id === card.video_id}
        
        <!-- Build dynamic actions for this card. The only place i do nested ternary here. Eww -->
        {@const cardActions = isLockedHere ? [
          {
            icon: LockOpenIcon,
            id: 'unlock',
            label: 'Unlock',
            class: 'text-rose-700 hover:bg-rose-100',
            run: () => multipleSearch.toggleLock(index, card)
          }
        ] : [
          ...multipleSearch.stages.map((stage, targetStageIndex) => ({
            icon: LockIcon,
            id: `lock-${targetStageIndex}`,
            label: `Lock into E${targetStageIndex + 1}`,
            class: 'text-slate-900 font-semibold hover:bg-slate-200',
            disabled: multipleSearch.eventFrameLockArray[targetStageIndex] !== null,
            run: () => multipleSearch.toggleLock(targetStageIndex, card)
          })),
          // Exclude actions available only when no card is locked
          ...(multipleSearch.eventLockedVideoId !== "" ? [] : [
            {
              id: 'exclude-video',
              label: `Exclude video ${card.video_id}`,
              icon: TrashIcon,
              class: 'text-rose-700 hover:bg-rose-100 hover:text-rose-900',
              run: () => {
                const current = multipleSearch.exclusion.trim();
                multipleSearch.exclusion = current ? `${current},${card.video_id}` : card.video_id;
              }
            },
            {
              id: 'exclude-frame',
              label: `Exclude frame ${card.video_id}-${card.keyframe_id}`,
              icon: TrashIcon,
              class: 'text-rose-700 hover:bg-rose-100 hover:text-rose-900',
              run: () => {
                const exclusionStr = `${card.video_id}-${card.keyframe_id}`;
                const current = multipleSearch.exclusion.trim();
                multipleSearch.exclusion = current ? `${current},${exclusionStr}` : exclusionStr;
              }
            }
          ])
        ]}

        <KeyframeCard
          item={card}
          accent="rose"
          bind:allowSubmit={multipleSearch.allowSingleSubmit}
          mode="semantic"
          actions={cardActions}
          lockedInLabel={isLockedHere ? `Locked in E${index + 1}` : ''}
          watchVideo={openVideo}
          bind:qaAnswer={multipleSearch.qaAnswer}
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
      <div class="flex flex-col items-left gap-2 p-2 w-2xl mx-auto mt-0 {BORDER_STYLE} bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-all">
        <div class="grid grid-cols-3 gap-2">
          <MyInputbox
            type="number"
            label="Limit"
            bind:value={multipleSearch.limit}
            min="1"
            max="1000"
            accent="rose"
            layout="vertical"
          />

          <MyInputbox
            type="number"
            label="Recall depth (r)"
            bind:value={multipleSearch.recallDepth}
            min="1"
            max="2000"
            accent="rose"
            layout="vertical"
          />

          <MyInputbox
            type="number"
            label="Chains / video"
            bind:value={multipleSearch.chainsPerVideo}
            min="1"
            accent="rose"
            layout="vertical"
          />

          <MyInputbox
            type="number"
            label="PRF k"
            bind:value={multipleSearch.prfK}
            min="1"
            accent="rose"
            layout="vertical"
          />

          <MyInputbox
            type="number"
            label="Max gap (s)"
            bind:value={multipleSearch.maxGapSeconds}
            min="0"
            accent="rose"
            layout="vertical"
          />

          <MyInputbox
            type="number"
            label="IoU threshold"
            bind:value={multipleSearch.iouThreshold}
            min="0"
            max="1"
            step="0.1"
            accent="rose"
            layout="vertical"
          />
        </div>
        <MyInputbox type="text" label="Exclusion" bind:value={multipleSearch.exclusion} width="w-full" accent="rose" layout="vertical" disabled={multipleSearch.eventLockedVideoId !== ""}/>
        <div class="mt-2 flex flex-wrap items-center gap-2 border-t-2 border-slate-900 pt-2">
          <MyCheckbox
            label="Weights"
            bind:checked={multipleSearch.showWeightsDrawer}
            accent="rose"
          />

          {#if multipleSearch.showWeightsDrawer}
          <div class="grid grid-cols-4 gap-2">
            {#each multipleSearch.stages as stage, index (stage.id)}
              <MyInputbox
                type="number"
                label={`E${index + 1}`}
                bind:value={multipleSearch.stageWeights[index]}
                min="0"
                step="0.1"
                accent="rose"
                layout="vertical"
              />
            {/each}
          </div>
          {/if}
        </div>
      </div>
    {/if}

    

    <div class="mb-4"></div>
    
    <!-- Lock shown -->
    {#if multipleSearch.eventLockedVideoId !== ""}
    <div class="mx-auto flex w-fit items-center justify-center gap-4 p-1 font-bold text-xl select-none {BORDER_STYLE} {rose.bgSubtle} shadow-xs">
      <div class="relative flex items-center -space-x-3 {rose.text}">
        <LockIcon size="20px" weight="duotone" class="relative z-10 translate-y-1 drop-shadow" />
        <LockIcon size="20px" weight="duotone" class="relative z-20 drop-shadow" />
        <LockIcon size="20px" weight="duotone" class="relative z-30 -translate-y-1 drop-shadow" />
      </div>
      <span class="{rose.text}">{multipleSearch.eventLockedVideoId} is locked {multipleSearch.sequenceView ? "in Event view" : ""}</span>
      <button
        type="button"
        class="flex p-1 gap-2 mr-4 items-center {BORDER_STYLE} {rose.bg} {rose.hover} text-white text-sm font-semibold {PRESSED_ANIM}"
        onclick={() => multipleSearch.clearLocks()}
      >
        <LockOpenIcon size="16px" weight="bold" />
        <span class="hidden xl:inline">Unlock all</span>
      </button>
      {#if multipleSearch.allEventFilled()}
      {@render trakeSubmitControlGroup(multipleSearch.eventFrameLockArray as TemporalMatch[])}
      {/if}
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
          <!-- Total Results header & pagination control -->
          <div class="flex items-center justify-between text-sm font-semibold text-slate-500 select-none px-2">
            <span>Total Sequences: {multipleSearch.sequenceResults.length}</span>
            {@render sequencePaginationControl()}
          </div>

          {#each paginatedSequenceResults as item (`${item.video_id}-${item.rank}-${item.score}`)}
            {@render sequenceDisplay(item)}
          {/each}

          <div class="flex justify-center mt-2 pb-6">
            {@render sequencePaginationControl()}
          </div>
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