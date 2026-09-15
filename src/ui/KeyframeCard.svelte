<script lang="ts">
  import type { Item } from '../lib/types';
  import { ApiClient } from '../lib/api';
  import {
    ACCENT_PALETTES,
    BORDER_STYLE,
    BORDER_STYLE_LIGHT
  } from './common/CommonStyle';

  type CardItem = Item & {
    transcriptText?: string;
    ocrText?: string;
  };

  interface Props {
    item: CardItem;
    stageIndex?: number;
    qaEnabled?: boolean;
    qaAnswer?: string;
    variant?: 'single' | 'sequence' | 'events' | 'assigned';
    stages?: unknown[];
    assign?: (item: CardItem, index: number) => void;
    assignedStageId?: number | null;
    isSelected?: boolean;
    added?: boolean;
    addedOrder?: number;
    excluded?: boolean;
    choose?: (item: CardItem, answer?: string) => void;
    addToList?: (item: CardItem) => void;
    excludeVideo?: (videoId: string) => void;
    setSimilarFrame?: (videoId: string, keyframeId: string) => void;
    watchVideo?: (item: CardItem) => void;
  }

  let {
    item,
    stageIndex = 0,
    qaEnabled = false,
    qaAnswer = $bindable(''),
    variant = 'single',
    stages = [],
    assign = () => {},
    assignedStageId = null,
    isSelected = false,
    added = false,
    addedOrder = 0,
    excluded = false,
    choose,
    addToList,
    excludeVideo = () => {},
    setSimilarFrame = () => {},
    watchVideo = () => {}
  }: Props = $props();

  const api = new ApiClient();

  // Derived values stay synchronized when Svelte reuses this component
  // for a different result item.
  let videoId = $derived(item.video_id);
  let keyframeId = $derived(item.keyframe_id);
  let timestampMs = $derived(item.timestamp_ms);
  let frameIndex = $derived(item.frame_idx);

  let resolvedScore = $derived(item.score ?? undefined);
  let formattedScore = $derived(
    resolvedScore === undefined ? 'N/A' : resolvedScore.toFixed(4)
  );

  let hasKeyframe = $derived(
    Boolean(
      keyframeId &&
        keyframeId !== '0' &&
        keyframeId !== '' &&
        keyframeId !== 'undefined'
    )
  );

  let frameLabel = $derived(
    hasKeyframe ? `Frame #${frameIndex ?? keyframeId}` : 'None'
  );

  let thumbnailUrl = $derived(
    hasKeyframe ? api.getKeyframeImageUrl(videoId, keyframeId) : ''
  );

  let displayTime = $derived(formatTime(timestampMs, hasKeyframe, keyframeId));

  let isImageError = $state(false);
  let isOcrExpanded = $state(false);
  let isTranscriptExpanded = $state(false);
  let moved = $state(false);

  const cardBorder = BORDER_STYLE;
  const metadataBorder = BORDER_STYLE_LIGHT;
  const bluePalette = ACCENT_PALETTES.blue;
  const rosePalette = ACCENT_PALETTES.rose;

  function formatTime(
    milliseconds: number | undefined,
    hasFrame: boolean,
    frameId: string
  ) {
    if (milliseconds !== undefined && milliseconds !== null) {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      return `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
    }

    return hasFrame ? `Frame ${frameId}` : 'N/A';
  }

  function handleMoveToTop() {
    choose?.(item, qaAnswer);
    moved = true;

    setTimeout(() => {
      moved = false;
    }, 1200);
  }

  function handleAssign(index: number) {
    assign(item, index);
  }
</script>

<article class={`group flex h-full flex-col overflow-hidden ${cardBorder}`}>
  <button
    type="button"
    class="relative aspect-video w-full overflow-hidden border-b-2 border-slate-900 bg-slate-100 text-left"
    onclick={() => watchVideo(item)}
    title={`Watch video ${videoId}`}
  >
    {#if hasKeyframe && !isImageError && thumbnailUrl}
      <img
        src={thumbnailUrl}
        alt={`Frame ${keyframeId} from ${videoId}`}
        class={`h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105 ${
          excluded ? 'opacity-40 grayscale' : ''
        }`}
        loading="lazy"
        onerror={() => (isImageError = true)}
      />
    {:else}
      <div class="flex h-full w-full items-center justify-center bg-slate-200 text-xs font-bold text-slate-500">
        No Keyframe
      </div>
    {/if}

    <span class="absolute inset-x-0 bottom-0 bg-slate-950/65 px-2 py-1 text-center text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
      Watch Video
    </span>

    {#if assignedStageId !== null && !isSelected}
      <span class="absolute left-1.5 top-1.5 border-2 border-slate-900 bg-rose-700 px-1.5 py-0.5 text-[9px] font-bold text-white">
        E{assignedStageId + 1}
      </span>
    {/if}
  </button>

  <div class="flex flex-1 flex-col gap-1 p-2 text-slate-700">
    <div class="flex items-center justify-between gap-1.5">
      <div class="flex min-w-0 items-center gap-1.5">
        <span
          class="min-w-0 truncate border-2 border-slate-900 bg-blue-100 px-1 py-0.5 font-mono text-base font-bold text-blue-950"
          title={videoId}
        >
          {videoId}
        </span>

        <span
          class="truncate font-mono text-sm font-bold text-slate-700"
          title={frameLabel}
        >
          {frameLabel}
        </span>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          class={`flex h-7 w-7 items-center justify-center border-2 border-slate-900 ${rosePalette.bgSubtle} ${rosePalette.text} ${rosePalette.hoverSubtle} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600`}
          onclick={() => excludeVideo(videoId)}
          title={`Exclude video ${videoId}`}
          aria-label={`Exclude video ${videoId}`}
        >
          🗑
        </button>

        {#if hasKeyframe}
          <button
            type="button"
            class={`flex h-7 w-7 items-center justify-center border-2 border-slate-900 ${bluePalette.bgSubtle} ${bluePalette.text} ${bluePalette.hoverSubtle} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`}
            onclick={() => setSimilarFrame(videoId, keyframeId)}
            title={`Find frames similar to ${videoId}-${keyframeId}`}
            aria-label={`Find similar frames for ${videoId}-${keyframeId}`}
          >
            <span class="font-mono text-sm font-bold leading-none">~</span>
          </button>
        {/if}
      </div>
    </div>

    <div class="flex items-center justify-between gap-1.5 font-mono text-sm text-slate-700">
      {#if resolvedScore !== undefined}
        <span class="shrink-0 border-2 border-slate-900 bg-amber-100 px-1.5 py-0.5 text-sm font-bold text-amber-900">
          Score: <span class="font-mono">{formattedScore}</span>
        </span>
      {:else}
        <span></span>
      {/if}

      <span class="ml-auto shrink-0 font-mono text-sm font-bold text-slate-600">
        {displayTime}
      </span>
    </div>

    {#if item.transcriptText}
      <div class="border-2 border-slate-900 bg-blue-50 px-1.5 py-1">
        <button
          type="button"
          class="flex w-full items-center justify-between text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          onclick={() => (isTranscriptExpanded = !isTranscriptExpanded)}
        >
          <span>💬 Transcript</span>
          <span class="text-[10px] font-medium text-slate-500">
            {isTranscriptExpanded ? 'Collapse' : 'Expand'}
          </span>
        </button>

        <div
          class={`whitespace-pre-wrap text-sm italic text-blue-950 ${
            isTranscriptExpanded ? 'mt-1' : 'line-clamp-2'
          }`}
        >
          "{item.transcriptText}"
        </div>
      </div>
    {/if}

    {#if item.ocrText}
      <div class="border-2 border-slate-900 bg-sky-50 px-1.5 py-1">
        <button
          type="button"
          class="flex w-full items-center justify-between text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          onclick={() => (isOcrExpanded = !isOcrExpanded)}
        >
          <span>🔍 OCR Match</span>
          <span class="text-[10px] font-medium text-slate-500">
            {isOcrExpanded ? 'Collapse' : 'Expand'}
          </span>
        </button>

        <div
          class={`whitespace-pre-wrap text-sm text-sky-900 ${
            isOcrExpanded ? 'mt-1' : 'line-clamp-2'
          }`}
        >
          {item.ocrText}
        </div>
      </div>
    {/if}

    {#if qaEnabled}
      <div class="border-t-2 border-slate-900/10 pt-1">
        <label class="mb-1 block text-sm text-slate-500" for={`answer-${videoId}-${keyframeId}`}>
          Answer:
        </label>

        <input
          id={`answer-${videoId}-${keyframeId}`}
          type="text"
          class="w-full border-2 border-slate-900 bg-white px-2 py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Type the answer for this frame..."
          bind:value={qaAnswer}
        />
      </div>
    {/if}

    {#if variant === 'single' && choose}
      <div class="mt-auto flex gap-1.5 pt-1.5">
        <button
          type="button"
          class={`flex flex-1 items-center justify-center border-2 border-slate-900 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
            moved
              ? 'bg-blue-700 text-white'
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
          onclick={handleMoveToTop}
        >
          {moved ? 'Moved' : 'Move to top'}
        </button>

        <button
          type="button"
          class={`flex flex-1 items-center justify-center border-2 border-slate-900 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            added
              ? 'bg-emerald-500 text-white'
              : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
          onclick={() => addToList?.(item)}
        >
          {added ? `#${addedOrder}` : 'Add'}
        </button>
      </div>
    {/if}

    {#if (variant === 'events' || variant === 'assigned') && stages.length > 0}
      <div class="mt-auto flex gap-1.5 pt-1.5">
        {#each stages as _, index}
          <button
            type="button"
            class={`flex-1 border-2 border-slate-900 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 ${
              assignedStageId === index
                ? 'bg-rose-700 text-white'
                : 'bg-rose-100 text-rose-900 hover:bg-rose-200'
            }`}
            onclick={() => handleAssign(index)}
            title={`Assign to E${index + 1}`}
          >
            E{index + 1}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</article>