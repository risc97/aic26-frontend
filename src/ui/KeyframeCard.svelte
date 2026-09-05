<script lang="ts">
  import type { Item } from '../lib/types';
  import { ApiClient } from '../lib/api';

  interface Props {
    item: Item & { transcriptText?: string; ocrText?: string };
    stageIndex?: number;
    qaEnabled?: boolean;
    qaAnswer?: string;
    variant?: 'single' | 'sequence' | 'events' | 'assigned';
    stages?: any[];
    onAssign?: (item: any, idx: number) => void;
    assignedStageId?: number | null;
    isSelected?: boolean;
    added?: boolean;
    addedOrder?: number;
    excluded?: boolean;
    onChoose?: (item: any, qa?: string) => void;
    onAddToList?: (item: any) => void;
    onQaAnswerChange?: (keyframeId: string, val: string) => void;
    onExcludeVideo?: (videoId: string) => void;
    onSetSimilarFrame?: (videoId: string, keyframeId: string) => void;
    onWatchVideo?: (item: any) => void;
  }

  let {
    item,
    stageIndex = 0,
    qaEnabled = false,
    qaAnswer = '',
    variant = 'single',
    stages = [],
    onAssign = () => {},
    assignedStageId = null,
    isSelected = false,
    added = false,
    addedOrder = 0,
    excluded = false,
    onChoose,
    onAddToList,
    onQaAnswerChange = () => {},
    onExcludeVideo = () => {},
    onSetSimilarFrame = () => {},
    onWatchVideo = () => {},
  }: Props = $props();

  const api = new ApiClient();
  const { video_id, keyframe_id, timestamp_ms } = item;

  let resolvedScore = $derived(item.score ?? undefined);
  let imgError = $state(false);

  let hasKeyframe = $derived(
    Boolean(
      keyframe_id &&
      keyframe_id !== '0' &&
      keyframe_id !== '' &&
      keyframe_id !== 'undefined'
    )
  );

  let thumbnailUrl = $derived(
    hasKeyframe ? api.getKeyframeImageUrl(video_id, keyframe_id) : ''
  );

  let formattedScore = $derived(
    resolvedScore !== undefined ? resolvedScore.toFixed(4) : 'N/A'
  );

  function formatTime(ms: number | undefined) {
    if (ms !== undefined && ms !== null) {
      const totalSec = Math.floor(ms / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return hasKeyframe ? `Frame ${keyframe_id}` : 'N/A';
  }

  let isOcrExpanded = $state(false);
  let isTranscriptExpanded = $state(false);
  let moved = $state(false);
  let isCompactMeta = $derived(variant === 'events' || variant === 'assigned');
  let tiltCls = $derived(variant === 'single' ? 'sketch-tilt' : '');

  let stateStyles = $derived(
    isSelected
      ? 'border-rose-600 bg-rose-100'
      : excluded
        ? 'border-neutral-900 bg-slate-200'
        : assignedStageId !== null
          ? 'border-rose-600 bg-rose-100'
          : added
            ? 'border-emerald-500 bg-emerald-50'
            : isCompactMeta
              ? 'border-neutral-900 bg-slate-200 hover:border-slate-400'
              : variant === 'sequence'
                ? 'border-neutral-900 bg-slate-200 hover:border-slate-400'
                : 'border-neutral-900 bg-slate-100 hover:border-slate-400'
  );

  let chipTheme = $derived(
    variant === 'events' || variant === 'assigned' || variant === 'sequence'
      ? 'bg-rose-100 text-rose-950'
      : 'bg-blue-100 text-blue-950'
  );
</script>

<div class={`group relative flex h-full flex-col overflow-hidden border-2 motion-safe:transition-all motion-safe:duration-300 ${tiltCls} ${stateStyles}`}>
  <!-- Thumbnail -->
  <div class={`relative aspect-video overflow-hidden border-b-2 border-neutral-900 ${excluded ? 'bg-slate-200' : 'bg-slate-100'}`}>
    {#if hasKeyframe && !imgError && thumbnailUrl}
      <img
        src={thumbnailUrl}
        alt={`Frame ${keyframe_id} - ${video_id}`}
        class={`h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105 ${excluded ? 'opacity-40 grayscale' : ''}`}
        loading="lazy"
        onerror={() => (imgError = true)}
      />
    {:else}
      <div class="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-200 text-slate-500">
        <span class="text-xs font-bold">No Keyframe</span>
      </div>
    {/if}

    {#if excluded}
      <div class="diagonal-stripes pointer-events-none absolute inset-0" aria-hidden="true" />
    {/if}

    {#if assignedStageId !== null && !isSelected}
      <div class="absolute left-1.5 top-1.5 z-10 flex items-center gap-1 border-2 border-neutral-900 bg-rose-700 px-1.5 py-0.5 text-[9px] font-bold text-white">
        ✓ E{assignedStageId + 1}
      </div>
    {/if}

    <!-- Watch Video hover overlay -->
    <div class="absolute inset-0 flex items-center justify-center bg-slate-900/60 opacity-0 motion-safe:transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      <button
        class="flex items-center gap-1.5 border-2 border-neutral-900 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        type="button"
        onclick={() => onWatchVideo(item)}
      >
        ▶ Watch Video
      </button>
    </div>
  </div>

  <!-- Metadata -->
  <div class={`flex flex-1 flex-col gap-1 p-2.5 ${excluded ? 'text-slate-500 opacity-60' : 'text-slate-700'}`}>
    <div class="flex items-center justify-between gap-1.5">
      <div class="flex min-w-0 items-center gap-1.5">
        <span class={`min-w-0 truncate border-2 border-neutral-900 px-1 py-0.5 font-mono text-base font-bold ${chipTheme}`} title={video_id}>
          {video_id}
        </span>
        <span class="truncate font-mono text-sm font-bold text-slate-700" title={hasKeyframe ? `Frame #${item.frame_idx ?? keyframe_id}` : 'None'}>
          {hasKeyframe ? `Frame #${item.frame_idx ?? keyframe_id}` : 'None'}
        </span>
      </div>
      <div class="flex shrink-0 items-center gap-1.5">
        <button
          class={`flex h-7 w-7 items-center justify-center border-2 border-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 motion-safe:transition-colors ${
            excluded ? 'bg-rose-200 text-rose-700' : 'bg-rose-100 text-rose-600 hover:bg-rose-200 hover:text-rose-700'
          }`}
          onclick={() => onExcludeVideo(video_id)}
          title="Exclude this video from results"
          aria-label={`Exclude video ${video_id}`}
          type="button"
        >
          🗑
        </button>
        {#if hasKeyframe}
          <button
            class="flex h-7 w-7 items-center justify-center border-2 border-neutral-900 bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 motion-safe:transition-colors"
            onclick={() => onSetSimilarFrame(video_id, keyframe_id)}
            title={`Add Similar Frame (${video_id}-${keyframe_id})`}
            aria-label={`Add Similar Frame ${video_id}-${keyframe_id}`}
            type="button"
          >
            <span class="font-mono text-sm font-bold leading-none">~</span>
          </button>
        {/if}
      </div>
    </div>

    <!-- Row 2: Score & Time -->
    <div class="flex items-center justify-between gap-1.5 font-mono text-sm text-slate-700">
      {#if resolvedScore !== undefined}
        <span class="shrink-0 border-2 border-neutral-900 bg-amber-100 px-1.5 py-0.5 text-sm font-bold text-amber-900">
          Score: <span class="font-mono">{formattedScore}</span>
        </span>
      {:else}
        <span />
      {/if}
      <span class="ml-auto shrink-0 font-mono text-sm font-bold text-slate-600">
        {formatTime(timestamp_ms)}
      </span>
    </div>

    <!-- Transcript snippet -->
    {#if item.transcriptText}
      <div class="border-2 border-neutral-900 bg-blue-50 px-1.5 py-1" title={item.transcriptText}>
        <button
          type="button"
          onclick={() => (isTranscriptExpanded = !isTranscriptExpanded)}
          class="flex w-full items-center justify-between text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <span class="flex items-center gap-1">💬 <span>Transcript</span></span>
          <span class="text-[10px] font-medium text-slate-500">
            {isTranscriptExpanded ? 'Collapse' : 'Expand'}
          </span>
        </button>
        <div class={`whitespace-pre-wrap text-sm italic text-blue-950 ${isTranscriptExpanded ? 'mt-1' : 'line-clamp-2'}`}>
          <em>"{item.transcriptText}"</em>
        </div>
      </div>
    {/if}

    <!-- OCR snippet -->
    {#if item.ocrText}
      <div class="border-2 border-neutral-900 bg-sky-50 px-1.5 py-1" title={item.ocrText}>
        <button
          type="button"
          onclick={() => (isOcrExpanded = !isOcrExpanded)}
          class="flex w-full items-center justify-between text-sm font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <span>🔍</span> <span>OCR Match</span>
          <span class="text-[10px] font-medium text-slate-500">
            {isOcrExpanded ? 'Collapse' : 'Expand'}
          </span>
        </button>
        <div class={`whitespace-pre-wrap text-sm text-sky-900 ${isOcrExpanded ? 'mt-1' : 'line-clamp-2'}`}>
          {item.ocrText}
        </div>
      </div>
    {/if}

    <!-- QA input -->
    {#if qaEnabled}
      <div class="border-t-2 border-neutral-900/10 pt-1">
        <div class="mb-1 flex items-center gap-1 text-sm text-slate-500">Answer:</div>
        <input
          type="text"
          class="w-full border-2 border-neutral-900 bg-white px-2 py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Type the answer for this frame..."
          value={qaAnswer || ''}
          oninput={(e) => onQaAnswerChange(keyframe_id, (e.target as HTMLInputElement).value)}
        />
      </div>
    {/if}

    <!-- Footer actions -->
    {#if variant === 'single' && onChoose}
      <div class="mt-auto flex gap-1.5 pt-1.5">
        <button
          class={`flex flex-1 items-center justify-center gap-1.5 border-2 border-neutral-900 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 motion-safe:transition-colors ${
            moved ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
          onclick={() => {
            onChoose(item, qaAnswer);
            moved = true;
            setTimeout(() => (moved = false), 1200);
          }}
          type="button"
          title="Move this frame to the top of the submission list"
        >
          <span>{moved ? 'Moved' : 'Move to top'}</span>
        </button>
        <button
          class={`flex flex-1 items-center justify-center gap-1.5 border-2 border-neutral-900 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 motion-safe:transition-colors ${
            added ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
          onclick={() => onAddToList?.(item)}
          type="button"
          title={added ? 'Remove this frame from submission list' : 'Add frame'}
        >
          <span>{added ? `#${addedOrder}` : 'Add'}</span>
        </button>
      </div>
    {/if}

    {#if (variant === 'events' || variant === 'assigned') && stages.length > 0 && onAssign}
      <div class="mt-auto flex gap-1.5 pt-1.5">
        {#each stages as _, idx}
          {@const isAssigned = assignedStageId === idx}
          <button
            type="button"
            onclick={(e) => {
              e.stopPropagation();
              onAssign(item, idx);
            }}
            class={`flex-1 border-2 border-neutral-900 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 motion-safe:transition-colors ${
              isAssigned ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-900 hover:bg-rose-200 hover:text-rose-950'
            }`}
            title={`Assign to E${idx + 1}`}
          >
            E{idx + 1}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>