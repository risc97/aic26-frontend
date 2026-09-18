<script lang="ts">
  import { Toggle } from "bits-ui";
  import { apiClient } from "../lib/api";
  import { ACCENT_PALETTES, BORDER_STYLE, PRESSED_ANIM } from "./common/CommonStyle";
  import { 
    RewindIcon, 
    LessThanIcon, 
    PlayIcon, 
    PauseIcon, 
    GreaterThanIcon, 
    FastForwardIcon,
    TargetIcon,
    ArrowLineUpIcon, 
    PlusIcon, 
    AirplaneTakeoffIcon,
    QuestionIcon,
    ChatCenteredTextIcon
  } from 'phosphor-svelte';
    import { reviewQueue, type SingleReviewItem } from "../lib/reviewQueue.svelte";
    import { appState } from "../lib/appState.svelte";

  interface Props {
    accent?: 'blue' | 'rose' | 'emerald' | 'amber';
    videoId: string;
    frameIdx: number;
    fps?: number;
    qaReadonly?: boolean;
    qaAnswer?: string;
    isActive?: boolean;   // Parent may hide instead destroy, pass this to pause playback
  }
  
  let {
    accent = 'blue',
    videoId = '',
    frameIdx = $bindable(0),
    fps = $bindable(0),
    qaReadonly = false,
    qaAnswer = $bindable(''),
    isActive = true
  }: Props = $props();

  $inspect(fps, 'fps');

  let accentPalette = $derived(ACCENT_PALETTES[accent]);

  let videoElement = $state<HTMLVideoElement | null>(null);

  let FRAME_INTERVAL = $derived(fps > 0 ? 1/fps : 0);
  let MULTIFRAME_INTERVAL = $derived(fps > 0 ? FRAME_INTERVAL * 20 : 0);
  function playBackStep(seconds: number) {
    currentTime = Math.min(Math.max(0, currentTime + seconds), duration);
  }
  
  let paused = $state(true);
  let currentTime = $state(0);
  let currentFrameIdx = $derived(Math.floor(currentTime * fps));
  let duration = $state(0);

  // Continuous hold-to-seek logic
  let holdTimeout: ReturnType<typeof setTimeout> | null = null;
  let holdInterval: ReturnType<typeof setInterval> | null = null;

  function stopSeeking() {
    if (holdTimeout) {
      clearTimeout(holdTimeout);
      holdTimeout = null;
    }
    if (holdInterval) {
      clearInterval(holdInterval);
      holdInterval = null;
    }
  }

  function startSeeking(seconds: number, event: PointerEvent) {
    if (event.button !== 0) return; // Main button click only
    stopSeeking();
    
    // Step immediately on press
    playBackStep(seconds);

    // After 250ms of holding, seek repeatedly every 60ms
    holdTimeout = setTimeout(() => {
      holdInterval = setInterval(() => {
        playBackStep(seconds);
      }, 60);
    }, 250);
  }

  function displayTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const fraction = Math.floor((seconds % 1) * 100); // 100ths of a second
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${fraction.toString().padStart(2, '0')}`;
  }

  $effect(() => {
    if (videoElement && fps > 0 && frameIdx >= 0) {
      videoElement.currentTime = frameIdx / fps;
      videoElement.play().catch(() => {
        // Browser may block autoplay
      });
    }
    
    // Parent may hide instead destroy, pass this to pause playback
    if (!isActive) {
      paused = true;
    }

    // Dedicated effect strictly for fetching FPS when videoId changes
    const currentId = videoId;
    if (!currentId) return;
    let cancelled = false;

    (async () => {
      try {
        const fetchedFps = await apiClient.getVideoFps(currentId);
        if (!cancelled) {
          fps = fetchedFps ?? 0;
        }
      } catch (err) {
        if (!cancelled) fps = 0;
      }
    })();

    return () => {
      cancelled = true;
    };
  });
</script>

<div class="flex flex-col gap-2 w-full">
{#if !videoId}
  <div class="flex aspect-video items-center justify-center p-2 bg-slate-50 text-slate-800 select-none text-2xl font-semibold">
    No video loaded
  </div>
{:else if fps > 0}
  <!-- Video -->
  <div class="relative aspect-video bg-slate-800">
    <!-- svelte-ignore a11y_media_has_caption -->
    <video
      bind:this={videoElement}
      bind:paused
      bind:currentTime
      bind:duration
      src="{apiClient.getVideoStreamUrl(videoId)}#t={frameIdx / fps}"
      controls
      playsinline
      class="h-full w-full object-contain"
    ></video>
  </div>

  {#if appState.qaEnabled}
    <div class="{BORDER_STYLE} p-1 mt-1 flex flex-row gap-1 items-center">
      <label class="text-sm text-slate-800 select-none" for={`answer-${videoId}-${frameIdx}`}>
        <ChatCenteredTextIcon size="20px"/>
      </label>
      <input
        id={`answer-${videoId}-${frameIdx}`}
        type="text"
        class="w-full bg-white p-1 text-sm text-slate-800 placeholder:text-slate-400 {accentPalette.focusRing} rounded focus:outline-none"
        placeholder="Type the answer for this frame..."
        disabled={qaReadonly}
        bind:value={qaAnswer}
      />
    </div>
  {/if}

  <!-- Control area -->
  <div class="flex justify-between items-center w-full">
    <!-- Left control area -->
    <div class="flex items-center gap-1.5">
      <button 
      class="flex h-9 w-10 {BORDER_STYLE} bg-white {accentPalette.textDark} {accentPalette.hoverSubtle} {PRESSED_ANIM} items-center justify-center text-sm font-semibold outline-none"
      onpointerdown={(e) => startSeeking(-MULTIFRAME_INTERVAL, e)}
      onpointerup={stopSeeking}
      onpointerleave={stopSeeking}
      onpointercancel={stopSeeking}
      >
        <RewindIcon size="18px" weight="bold"/>
      </button>

      <button 
      class="flex h-9 w-10 {BORDER_STYLE} bg-white {accentPalette.textDark} {accentPalette.hoverSubtle} {PRESSED_ANIM} items-center justify-center text-sm font-semibold outline-none"
      onpointerdown={(e) => startSeeking(-FRAME_INTERVAL, e)}
      onpointerup={stopSeeking}
      onpointerleave={stopSeeking}
      onpointercancel={stopSeeking}
      >
        <LessThanIcon size="18px" weight="bold"/>
      </button>

      <Toggle.Root
        bind:pressed={paused}
        class="flex h-9 w-10 {BORDER_STYLE} bg-white {accentPalette.textDark} {accentPalette.hoverSubtle} {PRESSED_ANIM} items-center justify-center text-sm font-semibold outline-none"
      >
        {#if paused}
          <PlayIcon size="18px" weight="bold"/>
        {:else}
          <PauseIcon size="18px" weight="bold"/>
        {/if}
      </Toggle.Root>

      <button 
      class="flex h-9 w-10 {BORDER_STYLE} bg-white {accentPalette.textDark} {accentPalette.hoverSubtle} {PRESSED_ANIM} items-center justify-center text-sm font-semibold outline-none"
      onpointerdown={(e) => startSeeking(FRAME_INTERVAL, e)}
      onpointerup={stopSeeking}
      onpointerleave={stopSeeking}
      onpointercancel={stopSeeking}
      >
        <GreaterThanIcon size="18px" weight="bold"/>
      </button>

      <button 
      class="flex h-9 w-10 {BORDER_STYLE} bg-white {accentPalette.textDark} {accentPalette.hoverSubtle} {PRESSED_ANIM} items-center justify-center text-sm font-semibold outline-none"
      onpointerdown={(e) => startSeeking(MULTIFRAME_INTERVAL, e)}
      onpointerup={stopSeeking}
      onpointerleave={stopSeeking}
      onpointercancel={stopSeeking}
      >
        <FastForwardIcon size="18px" weight="bold"/>
      </button>

      <button 
      class="flex h-9 w-fit gap-1 p-1 {BORDER_STYLE} bg-white {ACCENT_PALETTES.amber.textDark} {ACCENT_PALETTES.amber.hoverSubtle} {PRESSED_ANIM} items-center justify-center text-sm font-bold outline-none"
      onclick={() => {
        currentTime = frameIdx / fps;
      }}
      >
        <TargetIcon size="18px" weight="bold"/>
        <span>#{frameIdx} ({displayTime(frameIdx / fps)})</span>
      </button>
      <Toggle.Root
        pressed={appState.qaEnabled}
        onPressedChange={(enabled) => (appState.qaEnabled = enabled)}
        aria-label="Toggle QA mode"
        title="Toggle QA mode"
        class="flex h-9 w-14 gap-1 items-center justify-center {BORDER_STYLE} font-sm font-semibold data-[state=on]:bg-emerald-500 data-[state=on]:text-white {PRESSED_ANIM}"
      >
        <QuestionIcon size="18px" weight="bold" />
        QA
      </Toggle.Root>
    </div>

    <!-- Right control area -->
    <div class="flex items-center gap-1.5">
      <div class="flex w-36 h-9 items-center justify-center p-1 gap-1 {BORDER_STYLE} {accentPalette.textDark} bg-white text-sm font-bold">
        <span>#{currentFrameIdx} ({displayTime(currentTime)})</span>
      </div>
      <button
        type="button"
        class="flex w-24 h-9 items-center justify-center p-1 gap-1 bg-white {BORDER_STYLE} {accentPalette.textDark} {accentPalette.hoverSubtle} text-sm font-bold {PRESSED_ANIM}"
        onclick={() => {
          const reviewItem: SingleReviewItem = {
            videoId: videoId,
            frameIndex: frameIdx,
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
        class="flex w-24 h-9 items-center justify-center p-1 gap-1 bg-white {BORDER_STYLE} {accentPalette.textDark} {accentPalette.hoverSubtle} text-sm font-bold {PRESSED_ANIM}"
        onclick={() => {
          const reviewItem: SingleReviewItem = {
            videoId: videoId,
            frameIndex: frameIdx,
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
        class="flex w-24 h-9 items-center justify-center p-1 gap-1 {BORDER_STYLE} {ACCENT_PALETTES.amber.bg} {ACCENT_PALETTES.amber.hover} text-slate-100 text-sm font-bold {PRESSED_ANIM}"
        onclick={() => console.log('Departure!')}
      >
        <AirplaneTakeoffIcon size="16px" weight="bold" />
        Submit
      </button>
    </div>
  </div>
{:else}
  <div class="flex aspect-video items-center justify-center p-2 bg-slate-50 {ACCENT_PALETTES.rose.text} select-none text-2xl font-semibold">
    Viewport unavailable: Invalid video / Video FPS can't be loaded
  </div>
{/if}
</div>