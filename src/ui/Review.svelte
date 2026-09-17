<script lang="ts">
  import { BORDER_STYLE, ACCENT_PALETTES } from "./common/CommonStyle";
  import MyInputbox from './common/MyInputbox.svelte';
  import VideoFrame from "./VideoFrame.svelte";

  const emerald = ACCENT_PALETTES.emerald;

  let videoId = ""

</script>

<div class="min-h-0 flex gap-2 p-1">
  <!-- Panel -->
  <div class="w-[30%] {BORDER_STYLE} p-2">
    <h2 class="text-lg font-bold text-slate-800">Video Frame</h2>
    <p class="text-sm text-slate-600">This is a sample video frame component with controls.</p>
  </div>
  <div class="flex flex-col w-[70%] p-2 items-center justify-center {BORDER_STYLE}">
    <div class="flex gap-2 items-center justify-center w-full">
      <MyInputbox label="Video ID" bind:value={videoId} accent="emerald" layout="horizontal" />
    </div>
    <VideoFrame videoId={videoId} frameIdx={1150} accent="emerald" />
  </div>
</div>  