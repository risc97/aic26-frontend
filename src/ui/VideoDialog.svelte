<script lang="ts">
  import { Dialog } from "bits-ui";
  import { ApiClient } from "../lib/api";
  import type { Item } from "../lib/types";

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: (Item & { transcriptText?: string; ocrText?: string }) | null;
  }

  let { open = $bindable(false), onOpenChange, item }: Props = $props();

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

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity" />
    <Dialog.Content class="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 border-2 border-neutral-900 bg-white p-6 shadow-xl focus:outline-none">
      <div class="flex items-center justify-between border-b-2 border-neutral-900 pb-3 mb-4">
        <Dialog.Title class="font-mono text-lg font-bold text-slate-900">
          Watch Video: {item?.video_id} {#if item?.timestamp_ms !== null}({Math.floor((item?.timestamp_ms || 0) / 1000)}s){/if}
        </Dialog.Title>
        <Dialog.Close class="border-2 border-neutral-900 px-2.5 py-1 text-sm font-thebold hover:bg-slate-100">
          ✕
        </Dialog.Close>
      </div>

      {#if item}
        <div class="flex flex-col gap-4">
          <div class="relative aspect-video w-full overflow-hidden border-2 border-neutral-900 bg-black">
            <video
              bind:this={videoRef}
              src={videoUrl}
              controls
              autoplay
              loop={isLooping}
              class="h-full w-full object-contain"
            ></video>
          </div>

          <!-- Controls / Looping Option -->
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer font-mono text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                bind:checked={isLooping}
                class="h-4 w-4 border-2 border-neutral-900 accent-rose-600"
              />
              Loop Video
            </label>

            <span class="font-mono text-xs text-slate-500">
              Frame: {item.keyframe_id} | Time: {item.timestamp_ms}ms
            </span>
          </div>
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>