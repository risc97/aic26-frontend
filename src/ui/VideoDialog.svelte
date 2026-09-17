<script lang="ts">
  import { Dialog } from "bits-ui";
  import { ApiClient } from "../lib/api";
  import VideoFrame from "./VideoFrame.svelte";
  import type { CardItem } from "../lib/types";
  import { BORDER_STYLE, PRESSED_ANIM } from "./common/CommonStyle";
  import { XIcon } from "phosphor-svelte";

  interface Props {
    open: boolean;
    item: CardItem | null;
    accent: 'blue' | 'rose' | 'emerald' | 'amber';
  }

  let { 
    open = $bindable(false), 
    item = null,
    accent
  }: Props = $props();

  const api = new ApiClient();
  let videoRef = $state<HTMLVideoElement | null>(null);
  let isLooping = $state(false);

  let videoUrl = $derived(item ? api.getVideoStreamUrl(item.video_id) : "");

  // When the dialog opens or item changes, seek to timestamp_ms
  $effect(() => {
    if (open && videoRef && item && item.timestamp_ms !== undefined) {
      const seconds = item.timestamp_ms / 1000;
      videoRef.currentTime = seconds;
      videoRef.play().catch(() => {});
    }
  });
</script>

<Dialog.Root {open}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-xs transition-opacity" />
    <Dialog.Content class="{BORDER_STYLE} fixed top-1/2 left-1/2 aspect-auto z-50 w-[90%] max-w-6xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none">
      <div class="flex items-center justify-between border-b-2 border-neutral-900 pb-3 mb-4">
        <Dialog.Title class="font-mono text-lg font-bold text-slate-900">
          Watch Video: {item?.video_id} {#if item?.timestamp_ms !== null}({Math.floor((item?.timestamp_ms || 0) / 1000)}s){/if}
        </Dialog.Title>
        <Dialog.Close class="{BORDER_STYLE} p-1 text-sm {PRESSED_ANIM}">
          <XIcon size="18px" weight="bold" />
        </Dialog.Close>
      </div>
      {#if item}
        <VideoFrame videoId={item.video_id} frameIdx={item.frame_idx} bind:fps={item.video_fps} accent={accent} isActive={open} />
      {:else}
        <div class="flex aspect-video items-center justify-center p-2 bg-slate-50 text-slate-800 select-none text-2xl font-semibold">
          No video selected
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>