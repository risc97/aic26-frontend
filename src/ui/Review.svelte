<script lang="ts">
  import { 
    PlayIcon,
    ListIcon,
    FileTextIcon,
    UploadSimpleIcon,
    TrashIcon,
    CopyIcon,
    CheckIcon,
    ArrowUpIcon,
    ArrowDownIcon,

    ArrowLineUpIcon

  } from "phosphor-svelte";
  import { Tabs } from "bits-ui";
  import { BORDER_STYLE, ACCENT_PALETTES, PRESSED_ANIM } from "./common/CommonStyle";
  import MyInputbox from './common/MyInputbox.svelte';
  import VideoFrame from "./VideoFrame.svelte";
  import { reviewQueue, isSingleReviewItem } from "../lib/reviewQueue.svelte";
  import type { ReviewItem, SingleReviewItem, TrakeReviewItem} from "../lib/reviewQueue.svelte";

  const emerald = ACCENT_PALETTES.emerald;

  let { isActive = true }: { isActive?: boolean } = $props();
  
  // Submission view
  let submissionView = $state('list');  // 'list' | 'raw'
  let currentItemIndex = $state({index: 0, event: 0});

  let videoId = $state("");
  let frameIndex = $state(0);
  let rawBuffer = $state('');
  let parseResult = $derived(reviewQueue.parseReviewQueue(rawBuffer));

  // Active states passed to VideoFrame (only updated on "Load" click)
  let activeVideoId = $state("");
  let activeFrameIndex = $state(0);
  let fps = $state(0);

  let copied = $state(false);

  let exportFilename = $state("");

  function handleExport() {
    const textToExport = reviewQueue.raw || rawBuffer;
    const blob = new Blob([textToExport], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFilename.trim() || 'submission'}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleCopy() {
    navigator.clipboard.writeText(rawBuffer);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1500);
  }

  function handleClear() {
    if (confirm("Are you sure you want to clear the submission queue?")) {
      rawBuffer = '';
      reviewQueue.items = [];
      reviewQueue.raw = '';
      localStorage.removeItem('aic_submission_text');
    }
  }

  function handleUploadCsv(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        rawBuffer = content;
      }
    };
    reader.readAsText(file);
    target.value = '';
  }

  function handleLoad() {
    activeVideoId = videoId;
    activeFrameIndex = frameIndex;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleLoad();
    }
  }

  function handleMoveToTop(index: number) {
    reviewQueue.moveToTop(index);
    if (currentItemIndex.index === index) {
      currentItemIndex = { index: 0, event: currentItemIndex.event };
    } else if (currentItemIndex.index < index) {
      currentItemIndex = { index: currentItemIndex.index + 1, event: currentItemIndex.event };
    }
  }

  function handleMoveUp(index: number) {
    reviewQueue.moveUp(index);
    if (currentItemIndex.index === index) {
      currentItemIndex = { index: index - 1, event: currentItemIndex.event };
    } else if (currentItemIndex.index === index - 1) {
      currentItemIndex = { index: index, event: currentItemIndex.event };
    }
  }

  function handleMoveDown(index: number) {
    reviewQueue.moveDown(index);
    if (currentItemIndex.index === index) {
      currentItemIndex = { index: index + 1, event: currentItemIndex.event };
    } else if (currentItemIndex.index === index + 1) {
      currentItemIndex = { index: index, event: currentItemIndex.event };
    }
  }

  function handleDelete(index: number) {
    reviewQueue.removeAt(index);
    if (currentItemIndex.index === index) {
      const newIndex = Math.max(0, index - 1);
      currentItemIndex = { index: newIndex, event: 0 };
      const newItem = reviewQueue.items[newIndex];
      if (newItem) {
        videoId = newItem.videoId;
        frameIndex = isSingleReviewItem(newItem) ? newItem.frameIndex : newItem.frameIndexArray[0] ?? 0;
        handleLoad();
      } else {
        videoId = "";
        frameIndex = 0;
        activeVideoId = "";
        activeFrameIndex = 0;
      }
    } else if (currentItemIndex.index > index) {
      currentItemIndex = { index: currentItemIndex.index - 1, event: currentItemIndex.event };
    }
  }

  // Safely sync queue items when editing raw buffer in raw view
  $effect(() => {
    if (submissionView === 'raw' && !parseResult.error) {
      reviewQueue.items = parseResult.items;
      reviewQueue.raw = rawBuffer;
      localStorage.setItem('aic_submission_text', rawBuffer);
    }
  });

  // $inspect(reviewQueue.items, "review queue items changed")
</script>

{#snippet ReviewItemContrl(index: number)}
<button
  type="button"
  class="{BORDER_STYLE} flex h-6 w-6 items-center justify-center text-slate-500 disabled:opacity-30 disabled:hover:text-slate-500 {PRESSED_ANIM} {emerald.hoverSubtle}"
  title="Move to top"
  disabled={index === 0}
  onclick={() => handleMoveToTop(index)}
>
  <ArrowLineUpIcon size="16px" weight="bold" />
</button>
<button
  type="button"
  class="{BORDER_STYLE} flex h-6 w-6 items-center justify-center text-slate-500 disabled:opacity-30 disabled:hover:text-slate-500 {PRESSED_ANIM} {emerald.hoverSubtle}"
  title="Move up"
  disabled={index === 0}
  onclick={() => handleMoveUp(index)}
>
  <ArrowUpIcon size="16px" weight="bold" />
</button>
<button
  type="button"
  class="{BORDER_STYLE} flex h-6 w-6 items-center justify-center text-slate-500 disabled:opacity-30 disabled:hover:text-slate-500 {PRESSED_ANIM} {emerald.hoverSubtle}"
  title="Move down"
  disabled={index === reviewQueue.items.length - 1}
  onclick={() => handleMoveDown(index)}
>
  <ArrowDownIcon size="16px" weight="bold" />
</button>
<button
  type="button"
  class="{BORDER_STYLE} flex h-6 w-6 items-center justify-center {ACCENT_PALETTES.rose.text} {PRESSED_ANIM} {ACCENT_PALETTES.rose.hoverSubtle}"
  title="Delete item"
  onclick={() => handleDelete(index)}
>
  <TrashIcon size="16px" weight="bold" />
</button>
{/snippet}

{#snippet DrawSingleReviewItem(item: SingleReviewItem, index: number)}
<div
  class="flex items-center justify-between gap-2 p-2 {BORDER_STYLE}
  {index === currentItemIndex.index ? emerald.bgSubtle : 'bg-white'}"
>
  <button
    type="button"
    class="flex items-center gap-2 text-left min-w-0 flex-1 {PRESSED_ANIM}"
    onclick={() => {
      currentItemIndex = {index, event: 0};
      frameIndex = item.frameIndex;
      videoId = item.videoId;
      handleLoad();
    }}
  >
    <span class="font-mono text-md font-semibold">{item.videoId}</span>
    <span class="bg-slate-100 px-1 font-mono text-sm">
      #{item.frameIndex}
    </span>
    {#if item.answer}
      <span class="{ACCENT_PALETTES.amber.bgSubtle} {ACCENT_PALETTES.amber.textDark} block w-full whitespace-normal break-words rounded px-1 font-mono text-sm font-semibold select-none">
        QA: {item.answer}
      </span>
    {/if}
  </button>

  <!-- Right -->
  <div class="flex shrink-0 items-center gap-2">
    {@render ReviewItemContrl(index)}
  </div>
</div>
{/snippet}

{#snippet DrawMultipleReviewItem(item: TrakeReviewItem, index: number)}
<div
  class="flex flex-col gap-2 p-2
    {index === currentItemIndex.index ? 'border-emerald-500 bg-emerald-50' : 'bg-white'}
    {BORDER_STYLE}"
>
  <div class="flex items-center justify-between gap-2">
    <!-- Left -->
    <div class="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
      <span class="font-mono text-md font-semibold">{item.videoId}</span>
      <div class="flex min-w-0 flex-wrap gap-1 items-center">
        {#each item.frameIndexArray as itemFrameIndex, frameIndexPosition}
          <button
            type="button"
            class="border-2 border-slate-900 px-1.5 py-0.5 font-mono text-sm font-bold
              {frameIndexPosition === currentItemIndex.event && index === currentItemIndex.index
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-900'}
              hover:brightness-95 {PRESSED_ANIM}"
            onclick={() => {
              currentItemIndex = {index, event: frameIndexPosition};
              frameIndex = itemFrameIndex;
              videoId = item.videoId;
              handleLoad();
            }}
          >
            E{frameIndexPosition + 1}: #{itemFrameIndex}
          </button>
        {/each}
      </div>
    </div>

    <!-- Right -->
    <div class="flex shrink-0 items-center gap-2">
      {@render ReviewItemContrl(index)}
    </div>
  </div>

  {#if item.answer}
    <span class="{ACCENT_PALETTES.amber.bgSubtle} {ACCENT_PALETTES.amber.textDark} block w-full whitespace-normal break-words rounded px-1 font-mono text-sm font-semibold select-none">
      QA: {item.answer}
    </span>
  {/if}
</div>
{/snippet}

<div class="min-h-0 flex gap-2 p-1">
  <!-- Panel -->
  <div class="flex flex-col w-[30%] {BORDER_STYLE} p-2">
    <!-- 1: Title -->
    <header class="flex items-center justify-between border-slate-900 p-2 select-none">
      <div class="flex items-center gap-4">
        <span class="text-md font-semibold">
          Submission List
        </span>
        <span class="{BORDER_STYLE} {emerald.bgSubtle} {emerald.textDark} p-1 font-mono text-xs font-bold">
          {reviewQueue.items.length} items
        </span>
      </div>

      <Tabs.Root
        value={submissionView}
        onValueChange={(value) => {
          if (value) {
            submissionView = value;
            if (value === 'raw') {
              rawBuffer = reviewQueue.raw;
            }
          }
        }}
      >
        <Tabs.List class="flex {BORDER_STYLE} bg-slate-100 p-1">
          <Tabs.Trigger
            value="list"
            class="flex items-center justify-center gap-1 p-1 text-sm transition-colors w-24 {PRESSED_ANIM} outline-none data-[state=active]:bg-white data-[state=active]:text-emerald-700"
          >
            <ListIcon size="16px" weight="bold" />
            List
          </Tabs.Trigger>

          <Tabs.Trigger
            value="raw"
            class="flex items-center justify-center gap-1 p-1 text-sm transition-colors w-24 {PRESSED_ANIM} outline-none data-[state=active]:bg-white data-[state=active]:text-emerald-700"
          >
            <FileTextIcon size="16px" weight="bold" />
            Raw
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </header>
    <!-- 2: Control -->
    <div class="flex items-center justify-between gap-2 border-slate-900 p-1 bg-slate-50 select-none">
      <div class="flex items-center gap-2">
        <label class="flex h-7 px-3 items-center justify-center gap-1.5 bg-white {BORDER_STYLE} {emerald.textDark} {emerald.hoverSubtle} text-xs font-semibold {PRESSED_ANIM} cursor-pointer select-none">
          <UploadSimpleIcon size="14px" weight="bold" />
          Upload CSV
          <input type="file" accept=".txt,.csv" class="hidden" onchange={handleUploadCsv} />
        </label>
        {#if reviewQueue.items.length > 0}
          <button
            type="button"
            onclick={handleClear}
            class="flex h-7 px-3 items-center justify-center gap-1.5 bg-white {BORDER_STYLE} {ACCENT_PALETTES.rose.textDark} {ACCENT_PALETTES.rose.hoverSubtle} text-xs font-semibold {PRESSED_ANIM} select-none"
            title="Clear queue"
          >
            <TrashIcon size="14px" weight="bold" />
            Clear
          </button>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={handleCopy}
          class="flex h-7 px-3 items-center justify-center gap-1.5 bg-white {BORDER_STYLE} {emerald.textDark} {emerald.hoverSubtle} text-xs font-semibold {PRESSED_ANIM} select-none"
          title="Copy raw text"
        >
          {#if copied}
            <CheckIcon size="14px" weight="bold" class="text-emerald-600" />
            Copied!
          {:else}
            <CopyIcon size="14px" weight="bold" />
            Copy
          {/if}
        </button>
      </div>
    </div>
    <!-- 3: View -->
    {#if submissionView === 'list'}
      <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {#each reviewQueue.items as item, index}
          {#if isSingleReviewItem(item)}
            {@render DrawSingleReviewItem(item, index)}
          {:else}
            {@render DrawMultipleReviewItem(item, index)}
          {/if}
        {/each}
      </div>
    {:else}
      <div class="flex min-h-0 flex-1 flex-col gap-2 p-2">
        <textarea
          bind:value={rawBuffer}
          aria-label="Raw submissions"
          spellcheck="false"
          placeholder={'Format: videoId,frameIdx,....[,"QA"]'}
          class="min-h-0 flex-1 {BORDER_STYLE} bg-white p-2 font-mono text-xm leading-5 text-slate-800 outline-none placeholder:text-slate-500 {emerald.focusRing} resize-none"
        ></textarea>

        {#if parseResult.error}
          <p class="p-2 font-mono text-xs rounded border-rose-700 border-2 {ACCENT_PALETTES.rose.textDark} {ACCENT_PALETTES.rose.bgSubtle} select-none">
            {parseResult.error}
          </p>
        {/if}
      </div>
    {/if}
    <!-- 4: Download -->
    <footer class="flex items-center justify-between gap-2 border-t border-slate-900 p-2 bg-slate-50">
      <div class="flex items-center gap-1 min-w-0 flex-1">
        <input 
          bind:value={exportFilename} 
          type="text"
          placeholder="my_submission"
          class="flex-1 bg-white p-1 text-sm  placeholder:text-slate-400 {emerald.focusRing} {emerald.textDark} {BORDER_STYLE}"
        />
        <span class="font-mono text-xs font-semibold text-slate-700 select-none shrink-0">.csv</span>
      </div>
      <button
        type="button"
        onclick={handleExport}
        class="flex h-7 px-3 items-center justify-center gap-1.5 bg-white {BORDER_STYLE} {emerald.textDark} {emerald.hoverSubtle} text-xs font-bold {PRESSED_ANIM} shrink-0 select-none"
        title="Export CSV"
      >
        <UploadSimpleIcon size="14px" weight="bold" class="rotate-180" />
        Export CSV
      </button>
    </footer>
  </div>
  <div class="flex flex-col w-[70%] p-4 gap-2 {BORDER_STYLE}">
    <div class="flex items-end gap-2">
      <MyInputbox label="Video ID" bind:value={videoId} accent="emerald" width="w-36" height="h-8" layout="vertical" onkeydown={handleKeydown}/>
      <MyInputbox label="Frame index" bind:value={frameIndex} type="number" accent="emerald" width="w-36" height="h-8" layout="vertical" onkeydown={handleKeydown}/>
      <MyInputbox label="FPS" value={fps} accent="emerald" width="w-36" height="h-8" layout="vertical" disableInput={true} />
      <button
        type="button"
        class="flex h-8 px-4 items-center justify-center gap-1.5 bg-white {BORDER_STYLE} {emerald.textDark} {emerald.hoverSubtle} text-sm font-bold {PRESSED_ANIM}"
        onclick={handleLoad}
      >
        <PlayIcon size="16px" weight="bold" />
        Load
      </button>
    </div>
    <VideoFrame videoId={activeVideoId} frameIdx={activeFrameIndex} bind:fps={fps} {isActive} qaHidden={true} accent="emerald" />
  </div>
</div>  