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
  let runOnce = $state(false);
  let frameIndex = $state(0);
  let nearbyKeyframes = $state<Item[]>([]);
  let scrollContainer = $state<HTMLDivElement | null>(null);

  // $inspect(nearbyKeyframes, "nearbyKeyframes");

  function formatMilliseconds(ms: number): string {
    const totalMs = Math.max(0, Math.floor(ms));

    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const centiseconds = Math.floor((totalMs % 1000) / 10);

    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    const cs = String(centiseconds).padStart(2, '0');

    return `${mm}:${ss}.${cs}`;
  }

  function handleKeyframeError(event: Event, videoId: string, keyframeId: string) {
    const image = event.currentTarget as HTMLImageElement;
    const fallbackUrl = apiClient.getKeyframeImageUrl2(videoId, keyframeId);

    // Try the fallback only once.
    if (image.src !== fallbackUrl) {
      image.src = fallbackUrl;
    } else {
      image.removeAttribute('src');
    }
  }

  $effect(() => {
    if (!open) {
      runOnce = false;
      return;
    }
    if (!item) return;

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
  });

  $effect(() => {
    // Auto scroll the nearby keyframes list to the current frame index
    if (open && nearbyKeyframes.length > 0 && scrollContainer && !runOnce) {
      runOnce = true;
      setTimeout(() => {
        const activeEl = scrollContainer?.querySelector(`[data-frame-idx="${frameIndex}"]`);
        activeEl?.scrollIntoView({ block: 'center', behavior: 'auto' });
      }, 50);
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-xs transition-opacity" />
    <Dialog.Content class="flex flex-col max-h-[90vh] overflow-hidden {BORDER_STYLE} fixed top-1/2 left-1/2 z-50 w-[85vw] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-lg focus:outline-none">
      <div class="flex min-h-0 flex-1 items-stretch gap-1">
        <section class="flex w-3/4 min-w-0 min-h-0 flex-col p-4">
          <header class="flex items-center justify-between border-neutral-900 pb-2 ">
            <Dialog.Title class="gap-2 flex items-center min-w-0 {accentPalette.textDark} font-mono">
              <div class="flex items-center gap-2 shrink-0">
                <FilmStripIcon size="24px" />
                <span class="text-xl font-bold">{item?.video_id}</span>
                <div class="h-6 w-24 p-1 {BORDER_STYLE} select-none text-sm flex items-center justify-center">
                  {item?.video_fps.toFixed(2)} fps
                </div>
              </div>

              {#if item?.time_start_ms && item?.time_end_ms}
              <div class="flex h-8 p-1 text-sm items-center gap-1 min-w-0 flex-1 select-none {accentPalette.bgSubtle} {accentPalette.textDark} rounded">
                <span class="font-semibold shrink-0 whitespace-nowrap {ACCENT_PALETTES.amber.text}">
                  Transcript ({formatMilliseconds(item?.time_start_ms)} - {formatMilliseconds(item?.time_end_ms)}):
                </span>
                <span class="truncate min-w-0" title={item?.text}>{item?.text}</span>
              </div>
              {/if}
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
        <aside class="flex w-1/4 min-h-0 min-w-0 flex-col {BORDER_STYLE} {accentPalette.bgSubtle} select-none">
          <div class="flex items-center justify-between border-b border-neutral-300 p-2">
            <h2 class="text-sm font-semibold {accentPalette.textDark}">
              Nearby keyframes
            </h2>
          </div>

          <div bind:this={scrollContainer} class="min-h-0 flex-1 overflow-y-auto p-3 self-stretch">
            <div class="grid grid-cols-2 gap-1.5">
              {#each nearbyKeyframes as kf}
                <button
                  type="button"
                  data-frame-idx={kf.frame_idx}
                  class="relative group block overflow-hidden rounded {PRESSED_ANIM} text-left {kf.frame_idx === frameIndex ? accentPalette.ring : ''}"
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
                    onerror={(e) => handleKeyframeError(e, kf.video_id, kf.keyframe_id)}
                  />
                  {#if kf.frame_idx !== frameIndex}
                  <div class="absolute inset-0 bg-black/40"></div>
                  {/if}
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