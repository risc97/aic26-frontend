<script lang="ts">
  import { Dialog } from "bits-ui";
  import { apiClient } from "../lib/api";
  import VideoFrame from "./VideoFrame.svelte";
  import type { CardItem, Item } from "../lib/types";
  import { BORDER_STYLE, PRESSED_ANIM, ACCENT_PALETTES } from "./common/CommonStyle";
  import { FilmStripIcon, XIcon } from "phosphor-svelte";

  interface Props {
    open: boolean;
    item: CardItem | null;
    accent: 'blue' | 'rose' | 'emerald' | 'amber';
    qaAnswer?: string
  }

  let { 
    open = $bindable(false), 
    item = null,
    accent,
    qaAnswer = $bindable("")
  }: Props = $props();

  const accentPalette = ACCENT_PALETTES[accent];

  let isLooping = $state(false);
  let frameIndex = $state(0);
  let nearbyKeyframes = $state<Item[]>([]);

  $inspect(nearbyKeyframes, "nearbyKeyframes");

  $effect(() => {
    if (open && item) {
      frameIndex = item.frame_idx;

      // Load 30 nearby keyframes before and after
      if (item.video_id) {
        const currentKf = item.keyframe_id;
        apiClient.listKeyframes(item.video_id)
          .then((res) => {
            const allKeyframes = res.keyframes ?? [];
            nearbyKeyframes = allKeyframes.filter(
              (kf) => Math.abs(Number(kf.keyframe_id) - Number(currentKf)) <= 30
            );
          })
          .catch(() => {
            nearbyKeyframes = [];
          });
      }
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-xs transition-opacity" />
    <Dialog.Content class="{BORDER_STYLE} fixed top-1/2 left-1/2 z-50 w-[95vw] max-w-[85vw] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-lg focus:outline-none">
      <div class="flex gap-1">
        <section class="flex w-4/5 min-w-0 min-h-0 flex-col p-4">
          <header class="flex items-center justify-between border-neutral-900 pb-2 ">
            <Dialog.Title class="gap-1 flex items-center {accentPalette.textDark} font-mono">
              <FilmStripIcon size="24px" />
              <span class="text-xl font-bold">{item?.video_id}</span>
              <div class="ml-4 h-6 w-24 p-1 {BORDER_STYLE} select-none text-sm flex items-center justify-center">
                {item?.video_fps.toFixed(2)} fps
              </div>
            </Dialog.Title>
            <Dialog.Close class="{BORDER_STYLE} p-1 text-sm {PRESSED_ANIM}">
              <XIcon size="18px" weight="bold" />
            </Dialog.Close>
          </header>
          {#if item}
            <VideoFrame videoId={item.video_id} bind:frameIdx={frameIndex} fps={item.video_fps} accent={accent} isActive={open} bind:qaAnswer={qaAnswer} />
          {:else}
            <div class="flex aspect-video items-center justify-center p-2 bg-slate-50 text-slate-800 select-none text-2xl font-semibold">
              No video selected
            </div>
          {/if}
        </section>

        <!-- Nearby keyframe -->
        <aside class="flex w-1/5 min-h-0 min-w-0 flex-col {BORDER_STYLE} {accentPalette.bgSubtle} max-h-[82vh] select-none">
          <div class="flex items-center justify-between border-b border-neutral-300 p-2">
            <h2 class="text-sm font-semibold {accentPalette.textDark}">
              Nearby keyframes
            </h2>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-3">
            <div class="flex flex-col gap-3">
              {#each nearbyKeyframes as kf}
                <button
                  type="button"
                  class="relative group block overflow-hidden rounded bg-black/5 {BORDER_STYLE} {PRESSED_ANIM} text-left"
                  onclick={() => {
                    if (item) {
                      frameIndex = kf.frame_idx;
                    }
                  }}
                >
                  <img
                    src={apiClient.getKeyframeImageUrl(kf.video_id, kf.keyframe_id)}
                    alt={`Frame ${kf.frame_idx}`}
                    class="w-full h-auto object-contain block"
                    loading="lazy"
                  />
                  <!-- Small text writing the frame index -->
                  <div class="absolute bottom-1 right-1 bg-black/75 text-white text-xs font-mono p-1 rounded">
                    #{kf.frame_idx}
                  </div>
                </button>
              {/each}
            </div>
          </div>

        </aside>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>