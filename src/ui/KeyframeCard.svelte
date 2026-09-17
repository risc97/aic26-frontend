<script lang="ts">
  import type { Component } from 'svelte';
  import type { CardItem } from '../lib/types';
  import { apiClient } from '../lib/api';
  import { reviewQueue, type SingleReviewItem } from '../lib/reviewQueue.svelte';
  import {
    ACCENT_PALETTES,
    BORDER_STYLE,
    BORDER_STYLE_LIGHT,
    PRESSED_ANIM,
    type AccentColor
  } from './common/CommonStyle';
    import { DropdownMenu } from 'bits-ui';
    import { DotsThreeVerticalIcon, ArrowLineUpIcon, PlusIcon, AirplaneTakeoffIcon } from 'phosphor-svelte';

  type CardAction = {
    id: string;
    label: string;
    icon?: Component;
    disabled?: boolean;
    class: string;
    run: (item: CardItem) => void;
  };

  interface Props {
    item: CardItem;
    type: 'single' | 'multiple';
    mode: 'semantic' | 'transcript' | 'ocr' | 'video_id';
    qaEnabled: boolean;
    qaAnswer: string;
    actions?: CardAction[];
    watchVideo?: (item: CardItem) => void;
  }

  let {
    item,
    type = 'single',
    mode = 'semantic',
    qaEnabled = false,
    qaAnswer = $bindable(''),
    actions,
    watchVideo = () => {}
  }: Props = $props();

  // Appearance
  let accentPalette = $derived(type === 'single' ? ACCENT_PALETTES.blue : ACCENT_PALETTES.rose);

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

  let displayTime = $derived(formatTime(timestampMs, keyframeId));

  let isOcrExpanded = $state(false);
  let isTranscriptExpanded = $state(false);

  function formatTime(
    milliseconds: number | undefined,
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

    return `Frame ${frameId}`;
  }
</script>

<article class="flex h-full flex-col overflow-hidden {BORDER_STYLE} {accentPalette.hoverSubtle} {accentPalette.bgSubtle} transition-all">
  <!-- Watch video trigger -->
  <button
    type="button"
    class="group/video relative aspect-video w-full overflow-hidden"
    onclick={() => watchVideo(item)}
    title={`Watch video ${videoId}`}
  >
    <img
      src={apiClient.getKeyframeImageUrl(videoId, keyframeId)}
      alt={`Frame ${keyframeId} from ${videoId}`}
      class={"h-full w-full object-cover"}
      loading="lazy"
      onerror={() => {}}
    />

    <span class="absolute inset-x-0 bottom-0 bg-slate-900/65 px-2 py-1 text-center text-xs font-bold text-white opacity-0 transition-opacity group-hover/video:opacity-100">
      Watch
    </span>
  </button>

  <div class="flex flex-1 flex-col gap-1 p-2 text-slate-700">
    <div class="flex items-center justify-between gap-2">

      <!-- Video ID & Hover Keyframe ID -->
      <div class="flex">
        <span
          class="group/id {BORDER_STYLE} truncate p-1 font-mono text-xl font-black {accentPalette.textDark}"
          title={`${videoId}-${keyframeId}`}
        >
          {videoId}<span class="hidden group-hover/id:inline">-{keyframeId}</span>
        </span>
      </div>

      <!-- Option -->
      <div class="flex shrink-0 items-center gap-2 {PRESSED_ANIM}">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="flex h-7 w-7 items-center justify-center {BORDER_STYLE} bg-slate-100 text-slate-700 hover:bg-slate-200"
            aria-label="Card actions"
          >
            <DotsThreeVerticalIcon size="18px" weight="bold" />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              class="z-50 min-w-40 {BORDER_STYLE} bg-slate-100 p-1 shadow-2xl"
              preventScroll={false}
              side="bottom"
              align="end"
              sideOffset={2}
            >
              {#each actions as action (action.id)}
                {@const Icon = action.icon}

                <DropdownMenu.Item
                  textValue={action.label}
                  onSelect={() => action.run(item)}
                  {...(action.disabled ? { disabled: true } : {})}
                  class="flex items-center gap-1 px-1 py-1 select-none text-sm data-highlighted:outline-none {PRESSED_ANIM} {action.disabled ? 'opacity-50 cursor-not-allowed' : ''} {action.class}"
                >
                  {#if Icon}
                    <Icon size="14px" />
                  {/if}

                  <span>{action.label}</span>
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>

    <!-- Info -->
    <div class="flex items-center justify-between gap-2 font-mono text-sm text-slate-700">
      {#if resolvedScore !== undefined}
        <span class="shrink-0 {BORDER_STYLE} bg-amber-100 p-0.5 text-sm font-bold font-mono text-amber-900">
          S: {formattedScore}
        </span>
      {/if}

      <span class="shrink-0 {BORDER_STYLE} p-0.5 font-mono text-sm {accentPalette.textDark}">
        F: #{frameIndex}
      </span>

      <div class="shrink-0 {BORDER_STYLE} p-0.5 font-mono text-sm font-bold {accentPalette.textDark}">
        {displayTime}
      </div>
    </div>

    <!-- Transcript  -->
    {#if mode === 'transcript' && item.text}
      <div class="{BORDER_STYLE} bg-blue-50 p-1">
        <button
          type="button"
          class="flex w-full items-center justify-between text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          onclick={() => (isTranscriptExpanded = !isTranscriptExpanded)}
        >
          <span class="select-none">💬 Transcript</span>
          <span class="text-sm font-medium text-slate-500">
            {isTranscriptExpanded ? 'Collapse' : 'Expand'}
          </span>
        </button>

        <div
          class={`whitespace-pre-wrap text-sm text-blue-950 ${
            isTranscriptExpanded ? 'mt-1' : 'line-clamp-2'
          }`}
        >
          "{item.text}"
        </div>
      </div>
    {/if}

    <!-- OCR -->
    {#if mode === 'ocr' && item.text}
      <div class="border-2 border-slate-900 bg-sky-50 px-1.5 py-1">
        <button
          type="button"
          class="flex w-full items-center justify-between text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          onclick={() => (isOcrExpanded = !isOcrExpanded)}
        >
          <span class="select-none">🔍 OCR Match</span>
          <span class="text-sm font-medium text-slate-500">
            {isOcrExpanded ? 'Collapse' : 'Expand'}
          </span>
        </button>

        <div
          class={`whitespace-pre-wrap text-sm text-sky-900 ${
            isOcrExpanded ? 'mt-1' : 'line-clamp-2'
          }`}
        >
          {item.text}
        </div>
      </div>
    {/if}

    {#if qaEnabled}
      <div class="{BORDER_STYLE} p-1 mt-1">
        <label class="block text-sm text-slate-800 select-none" for={`answer-${videoId}-${keyframeId}`}>
          Answer:
        </label>
        <input
          id={`answer-${videoId}-${keyframeId}`}
          type="text"
          class="w-full bg-white p-1 text-sm text-slate-800 placeholder:text-slate-400 {ACCENT_PALETTES.blue.focusRing} focus:outline-none"
          placeholder="Type the answer for this frame..."
          bind:value={qaAnswer}
        />
      </div>
    {/if}

    {#if type === 'single'}
      <div class="flex gap-1 pt-2">
        <button
          type="button"
          class="flex flex-1 items-center justify-center p-1 gap-1 {BORDER_STYLE} {ACCENT_PALETTES.emerald.hoverSubtle} text-sm font-bold {PRESSED_ANIM}"
          onclick={() => {
            const reviewItem: SingleReviewItem = {
              videoId: videoId,
              frameIndex: frameIndex,
              answer: qaAnswer || undefined
            };
            reviewQueue.addTop(reviewItem);
          }}
        >
          <ArrowLineUpIcon size="16px" weight="bold" />
          Add top
        </button>

        <button
          type="button"
          class="flex flex-1 items-center justify-center p-1 gap-1 {BORDER_STYLE} {ACCENT_PALETTES.emerald.hoverSubtle} text-sm font-bold {PRESSED_ANIM}"
          onclick={() => {
            const reviewItem: SingleReviewItem = {
              videoId: videoId,
              frameIndex: frameIndex,
              answer: qaAnswer || undefined
            };
            reviewQueue.add(reviewItem);
          }}
        >
          <PlusIcon size="16px" weight="bold" />
          Add
        </button>

        <button
          type="button"
          class="flex flex-1 items-center justify-center p-1 gap-1 {BORDER_STYLE} {ACCENT_PALETTES.amber.bg} {ACCENT_PALETTES.amber.hover} text-slate-100 text-sm font-bold {PRESSED_ANIM}"
          onclick={() => console.log('Departure!')}
        >
          <AirplaneTakeoffIcon size="16px" weight="bold" />
          Submit
        </button>
      </div>
    {/if}
  </div>
</article>