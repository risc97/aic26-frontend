<script lang="ts">
  import { PlayIcon } from "phosphor-svelte";
  import { BORDER_STYLE, ACCENT_PALETTES, PRESSED_ANIM } from "./common/CommonStyle";
  import MyInputbox from './common/MyInputbox.svelte';
  import VideoFrame from "./VideoFrame.svelte";

  const emerald = ACCENT_PALETTES.emerald;

  let { isActive = true }: { isActive?: boolean } = $props();

  let videoId = $state("");
  let frameIndex = $state(0);
  
  // Active states passed to VideoFrame (only updated on "Load" click)
  let activeVideoId = $state("");
  let activeFrameIndex = $state(0);
  let fps = $state(0);

  function handleLoad() {
    activeVideoId = videoId;
    activeFrameIndex = frameIndex;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleLoad();
    }
  }
</script>

<div class="min-h-0 flex gap-2 p-1">
  <!-- Panel -->
  <div class="w-[30%] {BORDER_STYLE} p-2">
    <h2 class="text-lg font-bold text-slate-800">Video Frame</h2>
    <p class="text-sm text-slate-600">This is a sample video frame component with controls.</p>
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
    <VideoFrame videoId={activeVideoId} frameIdx={activeFrameIndex} bind:fps={fps} {isActive} accent="emerald" />
  </div>
</div>  