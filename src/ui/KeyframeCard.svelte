<script lang="ts">
  import type { Component } from 'svelte';
  import type { CardItem, SearchMode } from '../lib/types';
  import { apiClient, dresClient, DresApiError } from '../lib/api';
  import { appState } from '../lib/appState.svelte';
  import { reviewQueue, type SingleReviewItem } from '../lib/reviewQueue.svelte';
  import {
    ACCENT_PALETTES,
    BORDER_STYLE,
    BORDER_STYLE_LIGHT,
    PRESSED_ANIM,
    type AccentColor
  } from './common/CommonStyle';
  import { DropdownMenu } from 'bits-ui';
  import { DotsThreeVerticalIcon, ArrowLineUpIcon, PlusIcon, AirplaneTakeoffIcon, ChatCenteredTextIcon, CheckFatIcon, CheckIcon, AirplaneTiltIcon } from 'phosphor-svelte';
  import { Toaster, toast } from 'svelte-sonner'

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
    accent: AccentColor;
    mode: SearchMode;
    allowSubmit?: boolean;
    qaAnswer: string;
    actions?: CardAction[];
    lockedInLabel?: string;     // for multiple search
    showFullKeyframe?: boolean;
    watchVideo?: (item: CardItem) => void;
  }

  let {
    item,
    accent = 'blue',
    allowSubmit = $bindable(true),
    mode = 'semantic',
    qaAnswer = $bindable(''),
    actions,
    lockedInLabel = $bindable(''),
    showFullKeyframe = false,
    watchVideo = () => {}
  }: Props = $props();

  // Appearance
  let accentPalette = ACCENT_PALETTES[accent];

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

  let animAdd = $state(false);
  let animAddTop = $state(false);
  let animSubmit = $state(false);

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

  async function handleSingleSubmit() {
    if (appState.qaEnabled && qaAnswer.trim() !== '') {
      // QA submit
      try {
        const res = await dresClient.submitQa(videoId, timestampMs, qaAnswer.trim());
        if(!res.status) {
          toast.error(`Error submitting QA: ${res}`);
        } else {
          if(res.correct) {
            toast.success("CORRECT!");
          } else {
            toast.error(`WRONG!`);
          }
        }
      } catch(error) {
        if(!(error instanceof DresApiError)) return;
        toast.error(`Error submitting QA: ${error.message}`);
      }
    } else {
      // KIS submit, +- 10ms range
      try {
        const res = await dresClient.submitKis(videoId, timestampMs);
        if(!res.status) {
          toast.error(`Error submitting KIS: ${res}`);
        } else {
          if(res.correct) {
            toast.success("CORRECT!");
          } else {
            toast.error(`WRONG!`);
          }
        }
      } catch(error) {
        if(!(error instanceof DresApiError)) return;
        toast.error(`Error submitting KIS: ${error.message}`);
      }
    }
  } 

  function handleKeyframeError(event: Event) {
    const image = event.currentTarget as HTMLImageElement;
    const fallbackUrl = apiClient.getKeyframeImageUrl2(videoId, keyframeId);

    // Try the fallback only once.
    if (image.src !== fallbackUrl) {
      image.src = fallbackUrl;
    } else {
      image.removeAttribute('src');
    }
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
      onerror={handleKeyframeError}
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
          {videoId}<span class={showFullKeyframe ? 'inline' : 'hidden group-hover/id:inline'}>-{keyframeId}</span>
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
    <div class="flex flex-wrap items-center justify-between gap-0.5 font-mono text-sm text-slate-700">
      {#if resolvedScore !== undefined}
        <span class="shrink-0 {BORDER_STYLE} bg-amber-100 p-0.5 text-sm font-bold font-mono text-amber-900">
          {formattedScore}
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
          <span class="select-none">Transcript</span>
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
          <span class="select-none">OCR</span>
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

    {#if appState.qaEnabled}
    <div class="{BORDER_STYLE} p-1 mt-1 flex flex-row gap-1 items-center">
      <label class="text-sm text-slate-800 select-none" for={`answer-${videoId}-${keyframeId}`}>
        <ChatCenteredTextIcon size="20px"/>
      </label>
      <input
        id={`answer-${videoId}-${keyframeId}`}
        type="text"
        class="w-full bg-white p-1 text-sm text-slate-800 placeholder:text-slate-400 {accentPalette.focusRing} rounded focus:outline-none"
        placeholder="Type the answer for this frame..."
        bind:value={qaAnswer}
      />
    </div>
  {/if}

    {#if lockedInLabel !== ''}
      <label class="select-none mt-1 flex items-center justify-center p-1 gap-1 text-sm font-bold {BORDER_STYLE} {accentPalette.bg} text-white">
        <CheckFatIcon size="16px" weight="bold" />
        {lockedInLabel}
      </label>
    {/if}

    {#if allowSubmit}
      <div class="flex gap-1 pt-2">
        <button
          type="button"
          class="flex flex-1 items-center justify-center px-0.5 py-1 gap-0.5 {BORDER_STYLE} text-sm font-bold transition-all {PRESSED_ANIM} {animAddTop ? 'bg-emerald-400' : `bg-white ${ACCENT_PALETTES.emerald.hoverSubtle}`}"
          onclick={() => {
            animAddTop = true;
            setTimeout(() => {
              animAddTop = false;
            }, 1500);
            const reviewItem: SingleReviewItem = {
              videoId: videoId,
              frameIndex: frameIndex,
              answer: appState.qaEnabled ? qaAnswer : undefined
            };
            reviewQueue.addTop(reviewItem);
          }}
        >
          {#if animAddTop}
          <CheckIcon size="14px" weight="bold" />
          <span class="hidden xl:inline">Added</span>
          {:else}
          <ArrowLineUpIcon size="14px" weight="bold" />
          <span class="hidden xl:inline">Add top</span>
          {/if}
        </button>

        <button
          type="button"
          class="flex flex-1 items-center justify-center px-0.5 py-1 gap-0.5 {BORDER_STYLE} text-sm font-bold transition-all {PRESSED_ANIM} {animAdd ? 'bg-emerald-400' : `bg-white ${ACCENT_PALETTES.emerald.hoverSubtle}`}"
          onclick={() => {
            animAdd = true;
            setTimeout(() => {
              animAdd = false;
            }, 1500);
            const reviewItem: SingleReviewItem = {
              videoId: videoId,
              frameIndex: frameIndex,
              answer: appState.qaEnabled ? qaAnswer : undefined
            };
            reviewQueue.add(reviewItem);
          }}
        >
          {#if animAdd}
          <CheckIcon size="14px" weight="bold" />
          <span class="hidden xl:inline">Added</span>
          {:else}
          <PlusIcon size="14px" weight="bold" />
          <span class="hidden xl:inline">Add</span>
          {/if}
        </button>

        <button
          type="button"
          class="flex flex-1 items-center justify-center px-0.5 py-1 gap-0.5 {BORDER_STYLE} text-sm font-bold transition-all {PRESSED_ANIM} {animSubmit ? 'bg-amber-400 text-slate-900' : `${ACCENT_PALETTES.amber.bg} ${ACCENT_PALETTES.amber.hover} text-slate-100`}"
          onclick={() => {
            animSubmit = true;
            setTimeout(() => {
              animSubmit = false;
            }, 1500);
            handleSingleSubmit();
          }}
        >
          {#if animSubmit}
          <AirplaneTiltIcon size="14px" weight="bold" />
          <span class="hidden xl:inline">Submitted</span>
          {:else}
          <AirplaneTakeoffIcon size="14px" weight="bold" />
          <span class="hidden xl:inline">Submit</span>
          {/if}
        </button>
      </div>
    {/if}
  </div>
</article>