<script lang="ts">
  import { DropdownMenu } from 'bits-ui';

  // Props / Callback interfaces matching the React version's API
  interface Props {
    mode?: 'single' | 'multiple' | 'submit' | 'logs';
    setMode?: (mode: 'single' | 'multiple' | 'submit' | 'logs') => void;
    singleQuery?: string;
    setSingleQuery?: (val: string) => void;
    videoKeyframeId?: string;
    setVideoKeyframeId?: (val: string) => void;
    singleSearchMode?: string;
    onSingleSearchModeChange?: (val: string) => void;
    modelKeyframe?: string;
    onModelKeyframeChange?: (val: string) => void;
    modelTranscriptSemantic?: string;
    onModelTranscriptSemanticChange?: (val: string) => void;
    singleLimit?: number | string;
    onSingleLimitChange?: (val: any) => void;
    singlePhrase?: boolean;
    onSinglePhraseChange?: (val: boolean) => void;
    singleConditions?: any;
    setSingleConditions?: (updater: any) => void;
    globalExcludeVids?: { enabled: boolean; value: string };
    setGlobalExcludeVids?: (updater: any) => void;
    onSearch?: () => void;
    isSearching?: boolean;
    qaEnabled?: boolean;
    setQaEnabled?: (val: boolean) => void;
    temporalSubmitMode?: 'sequence' | 'frame';
    onOpenConfigModal?: () => void;
    isMockMode?: boolean;
    apiConnected?: boolean;
    apiPending?: boolean;
    apiBaseUrl?: string;
    videoStartMs?: string;
    setVideoStartMs?: (val: string) => void;
    videoEndMs?: string;
    setVideoEndMs?: (val: string) => void;
  }

  let {
    mode = 'single',
    setMode = () => {},
    singleQuery = '',
    setSingleQuery = () => {},
    videoKeyframeId = '',
    setVideoKeyframeId = () => {},
    singleSearchMode = 'keyframe',
    onSingleSearchModeChange = () => {},
    modelKeyframe = 'siglip',
    onModelKeyframeChange = () => {},
    modelTranscriptSemantic = 'gte',
    onModelTranscriptSemanticChange = () => {},
    singleLimit = 100,
    onSingleLimitChange = () => {},
    singlePhrase = false,
    onSinglePhraseChange = () => {},
    singleConditions = { similarFrame: { enabled: false, videoId: '', keyframeId: '' } },
    setSingleConditions = () => {},
    globalExcludeVids = { enabled: true, value: '' },
    setGlobalExcludeVids = () => {},
    onSearch = () => {},
    isSearching = false,
    qaEnabled = false,
    setQaEnabled = () => {},
    temporalSubmitMode = 'sequence',
    onOpenConfigModal = () => {},
    isMockMode = false,
    apiConnected = false,
    apiPending = false,
    apiBaseUrl = 'http://localhost:8000',
    videoStartMs = '',
    setVideoStartMs = () => {},
    videoEndMs = '',
    setVideoEndMs = () => {},
  }: Props = $props();

  const MODE_OPTIONS = [
    { value: 'keyframe', label: 'Semantic', icon: 'sparkles' },
    { value: 'transcript_semantic', label: 'Transcript', icon: 'message-square' },
    { value: 'transcript_exact', label: 'Transcript Exact', icon: 'file-text' },
    { value: 'ocr_exact', label: 'OCR', icon: 'scan-text' },
    { value: 'video_id', label: 'Video ID', icon: 'film' },
  ];

  const MODE_TITLES: Record<string, string> = {
    keyframe: 'Semantic (Visual Keyframe)',
    transcript_semantic: 'Transcript semantic search',
    transcript_exact: 'Transcript exact search',
    ocr_exact: 'OCR search',
    video_id: 'Browse all keyframes of a video',
  };

  let showFilterDrawer = $state(false);

  // Keyboard navigation for search box
  function handleSearchboxKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      (e.target as HTMLElement)?.blur();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSearch();
    }
  }

  // Computed styles & states matching React header
  let isMultiple = $derived(mode === 'multiple');
  let logoBg = $derived(
    mode === 'multiple'
      ? 'bg-rose-700'
      : mode === 'submit'
        ? 'bg-emerald-600'
        : mode === 'logs'
          ? 'bg-amber-600'
          : 'bg-blue-700'
  );

  let pillFocus = $derived(
    mode === 'multiple'
      ? 'focus-within:ring-rose-600'
      : mode === 'submit'
        ? 'focus-within:ring-emerald-500'
        : mode === 'logs'
          ? 'focus-within:ring-amber-500'
          : 'focus-within:ring-blue-600'
  );

  let currentModeObj = $derived(MODE_OPTIONS.find((o) => o.value === singleSearchMode));
  let modeLabel = $derived(currentModeObj?.label || 'Semantic');

  let status = $derived(
    isMockMode
      ? { dot: 'bg-blue-600', title: 'Mock Mode (Test UI) is active. Click to configure.' }
      : apiPending
        ? { dot: 'bg-yellow-400', title: 'Checking backend connection... Click to configure.' }
        : apiConnected
          ? { dot: 'bg-emerald-500', title: `Connected: ${apiBaseUrl}. Click to configure.` }
          : { dot: 'bg-rose-600', title: `Backend Offline (${apiBaseUrl}). Click to configure.` }
  );

  function segBtnClass(active: boolean, accent: string) {
    return `flex h-9 items-center gap-1 px-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 motion-safe:transition-colors ${
      active
        ? `bg-neutral-900 text-white ${
            accent === 'rose'
              ? 'focus-visible:ring-rose-600'
              : accent === 'emerald'
                ? 'focus-visible:ring-emerald-500'
                : accent === 'amber'
                  ? 'focus-visible:ring-amber-500'
                  : 'focus-visible:ring-blue-600'
          }`
        : 'text-slate-600 hover:bg-slate-200'
    }`;
  }
</script>

<header class="z-20 shrink-0 border-b-2 border-neutral-900 bg-white select-none">
  <div class="flex w-full items-start gap-4 px-5 py-3">
    
    <!-- Left: Brand -->
    <div class="flex w-[170px] shrink-0 items-center gap-2.5">
      <div class={`flex h-11 w-11 shrink-0 items-center justify-center border-2 border-neutral-900 text-white ${logoBg}`}>
        <svg class="h-5 w-5 fill-current" viewBox="0 0 24 24">
          <path d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h16V5H4zm2 2h2v2H6V7zm4 0h8v2h-8V7zm-4 4h2v2H6v-2zm4 0h8v2h-8v-2zm-4 4h2v2H6v-2zm4 0h8v2h-8v-2z"/>
        </svg>
      </div>
      <h1 class="text-xl font-bold tracking-tight text-slate-900">CISC97</h1>
    </div>

    <!-- Center: Search Box Container -->
    <form
      onsubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
      class="flex min-w-0 flex-1"
    >
      {#if mode === 'single'}
        <div class={`flex w-full items-center overflow-hidden border-2 border-neutral-900 bg-blue-50 focus-within:ring-2 motion-safe:transition-all ${pillFocus}`}>
          
          <!-- Dropdown Search Mode (Bits UI) -->
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class="relative flex h-9 shrink-0 items-center gap-1.5 border-r-2 border-neutral-900 bg-slate-100 px-3 text-sm font-bold text-slate-800 hover:bg-slate-200 outline-none">
              <span>✨</span>
              <span>{modeLabel}</span>
              <span class="text-slate-500 ml-1">▾</span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content class="z-50 min-w-[160px] rounded bg-white p-1 shadow-md border-2 border-neutral-900">
                {#each MODE_OPTIONS as opt}
                  <DropdownMenu.Item
                    class="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-bold text-slate-800 hover:bg-blue-100 hover:text-blue-900 cursor-pointer outline-none"
                    onclick={() => onSingleSearchModeChange(opt.value)}
                  >
                    <span>{opt.label}</span>
                  </DropdownMenu.Item>
                {/each}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <!-- Model Chips / Sub-options -->
          {#if singleSearchMode === 'keyframe'}
            <div class="px-2 py-1 bg-blue-100 border-r-2 border-neutral-900 text-xs font-mono font-bold text-blue-900">
              {modelKeyframe}
            </div>
          {/if}
          {#if singleSearchMode === 'transcript_semantic'}
            <div class="px-2 py-1 bg-blue-100 border-r-2 border-neutral-900 text-xs font-mono font-bold text-blue-900">
              {modelTranscriptSemantic}
            </div>
          {/if}

          <!-- Phrase checkbox -->
          {#if singleSearchMode === 'ocr_exact' || singleSearchMode === 'transcript_exact'}
            <label class="ml-2 flex shrink-0 cursor-pointer items-center gap-1 border-2 border-neutral-900 bg-blue-100 px-1.5 py-0.5 text-[11px] font-bold text-blue-900" title="Phrase search">
              <input
                type="checkbox"
                class="h-3 w-3 accent-blue-700"
                checked={singlePhrase}
                onchange={(e) => onSinglePhraseChange((e.target as HTMLInputElement).checked)}
              />
              <span>Phrase</span>
            </label>
          {/if}

          <!-- Text Input / Video ID input -->
          {#if singleSearchMode === 'video_id'}
            <input
              class="h-9 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
              placeholder="Video ID (e.g. L01_V001)..."
              value={videoKeyframeId}
              oninput={(e) => setVideoKeyframeId((e.target as HTMLInputElement).value.toUpperCase())}
              onkeydown={handleSearchboxKeyDown}
            />
          {:else}
            <input
              class="h-9 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
              placeholder="Query: 'person riding a red bicycle'..."
              value={singleQuery}
              oninput={(e) => setSingleQuery((e.target as HTMLInputElement).value)}
              onkeydown={handleSearchboxKeyDown}
            />
          {/if}

          <!-- Filter drawer toggle button -->
          <button
            type="button"
            onclick={() => (showFilterDrawer = !showFilterDrawer)}
            class={`flex h-9 w-9 shrink-0 items-center justify-center border-l-2 border-neutral-900 text-slate-600 hover:bg-slate-100 outline-none transition-colors ${
              showFilterDrawer ? 'bg-blue-200 text-blue-800' : ''
            }`}
            title="Filters (Exclude Vids, OCR, Transcript, Similar Frame)"
            aria-label="Open filters"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>

          <!-- Search submit button -->
          <button
            type="submit"
            disabled={isSearching}
            class="flex h-9 w-12 shrink-0 items-center justify-center border-l-2 border-neutral-900 bg-blue-700 text-white hover:bg-blue-800 outline-none disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            title={singleSearchMode === 'video_id' ? 'View Keyframes' : 'Search'}
          >
            {#if isSearching}
              <span class="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
            {:else}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            {/if}
          </button>

        </div>
      {:else if mode === 'multiple'}
        <div class="flex w-full items-center overflow-hidden border-2 border-neutral-900 bg-rose-50">
          <div class="pl-4 pr-2 text-rose-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <span class="flex h-9 min-w-0 flex-1 items-center bg-transparent pr-4 text-sm font-medium text-slate-600">
            Describe each event below
          </span>
        </div>
      {:else if mode === 'logs'}
        <div class="flex w-full items-center overflow-hidden border-2 border-neutral-900 bg-amber-50">
          <div class="pl-4 pr-2 text-amber-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <span class="flex h-9 items-center bg-transparent pr-4 text-sm font-medium text-slate-700">
            View & inspect query logs and search history
          </span>
        </div>
      {:else}
        <div class="flex w-full items-center overflow-hidden border-2 border-neutral-900 bg-emerald-50">
          <div class="pl-4 pr-2 text-emerald-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </div>
          <span class="flex h-9 items-center bg-transparent pr-4 text-sm font-medium text-slate-500">
            View & inspect submissions
          </span>
        </div>
      {/if}
    </form>

    <!-- {/* Right: Mode Switcher + Controls */} -->
    <div class="flex shrink-0 items-center gap-2">
      <div class="flex border-2 border-neutral-900 bg-slate-100 p-0.5">
        <button
          type="button"
          onclick={() => setMode('single')}
          class={segBtnClass(mode === 'single', 'blue')}
          title="Single Keyframe Mode"
        >
          Single
        </button>
        <button
          type="button"
          onclick={() => setMode('multiple')}
          class={segBtnClass(mode === 'multiple', 'rose')}
          title="Temporal Sequential Mode"
        >
          Temporal
        </button>
        <button
          type="button"
          onclick={() => setMode('submit')}
          class={segBtnClass(mode === 'submit', 'emerald')}
          title="Review submission list"
        >
          Review
        </button>
        <button
          type="button"
          onclick={() => setMode('logs')}
          class={segBtnClass(mode === 'logs', 'amber')}
          title="View query logs"
        >
          Logs
        </button>
      </div>

      {#if mode === 'single' || (mode === 'multiple' && temporalSubmitMode === 'frame')}
        <button
          type="button"
          onclick={() => setQaEnabled(!qaEnabled)}
          class={`flex h-9 items-center gap-1.5 border-2 border-neutral-900 px-2 text-sm font-bold outline-none transition-colors ${
            qaEnabled ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
          title="QA Mode"
        >
          <span>QA</span>
        </button>
      {/if}

      <!-- Settings button -->
      <button
        type="button"
        onclick={onOpenConfigModal}
        class="flex h-9 w-9 items-center justify-center border-2 border-neutral-900 bg-white text-slate-700 hover:bg-slate-100 outline-none"
        title="API Request Configuration"
      >
        ⚙️
      </button>

      <!-- Status Dot -->
      <button
        type="button"
        onclick={onOpenConfigModal}
        class="flex h-9 w-9 items-center justify-center hover:bg-slate-100 outline-none"
        title={status.title}
      >
        <span class={`h-3.5 w-3.5 border border-slate-400 ${status.dot}`} />
      </button>
    </div>

  </div>

  <!-- Filter Drawer / Bar -->
  {#if mode === 'single' && showFilterDrawer}
    <div class="border-t-2 border-neutral-900 bg-slate-50 px-5 py-2.5">
      <div class="flex w-full flex-nowrap items-center gap-3 overflow-x-auto">
        {#if singleSearchMode === 'video_id'}
          <div class="flex shrink-0 items-center gap-2 border-2 border-neutral-900 px-2.5 py-1.5 bg-white">
            <span class="text-xs font-bold text-slate-800">Start (ms)</span>
            <input
              type="text"
              class="w-24 text-xs font-mono outline-none"
              placeholder="0"
              value={videoStartMs}
              oninput={(e) => setVideoStartMs((e.target as HTMLInputElement).value)}
              onkeydown={handleSearchboxKeyDown}
            />
          </div>
          <div class="flex shrink-0 items-center gap-2 border-2 border-neutral-900 px-2.5 py-1.5 bg-white">
            <span class="text-xs font-bold text-slate-800">End (ms)</span>
            <input
              type="text"
              class="w-24 text-xs font-mono outline-none"
              placeholder="e.g. 60000"
              value={videoEndMs}
              oninput={(e) => setVideoEndMs((e.target as HTMLInputElement).value)}
              onkeydown={handleSearchboxKeyDown}
            />
          </div>
        {:else}
          <div class="flex shrink-0 items-center gap-2 border-2 border-neutral-900 px-2.5 py-1.5 bg-white">
            <span class="text-xs font-bold text-slate-800">Limit</span>
            <input
              type="text"
              class="w-16 text-xs font-mono outline-none"
              placeholder="100"
              value={singleLimit}
              oninput={(e) => onSingleLimitChange((e.target as HTMLInputElement).value)}
            />
          </div>

          <div class={`flex shrink-0 items-center gap-2 border-2 border-neutral-900 px-2.5 py-1.5 flex-1 min-w-[220px] ${globalExcludeVids.enabled ? 'bg-blue-100' : 'bg-white'}`}>
            <span class="text-xs font-bold text-slate-800">Exclude Vids</span>
            <button
              type="button"
              onclick={() => setGlobalExcludeVids((prev: any) => ({ ...prev, enabled: !prev.enabled }))}
              class={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${globalExcludeVids.enabled ? 'bg-blue-700' : 'bg-slate-300'}`}
            >
              <div class={`w-3 h-3 rounded-full bg-white transition-transform ${globalExcludeVids.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <input
              type="text"
              disabled={!globalExcludeVids.enabled}
              class="flex-1 min-w-0 text-xs font-mono bg-transparent outline-none disabled:opacity-40"
              placeholder="Video IDs: L01_V001..."
              value={globalExcludeVids.value}
              oninput={(e) => setGlobalExcludeVids((prev: any) => ({ ...prev, value: (e.target as HTMLInputElement).value }))}
              onkeydown={handleSearchboxKeyDown}
            />
          </div>

          <div class="flex shrink-0 items-center gap-2 border-2 border-neutral-900 px-2.5 py-1.5 bg-white">
            <span class="text-xs font-bold text-slate-800">Similar Frame:</span>
            <span class="text-xs italic text-slate-400">Click ~ on any card to find similar</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</header>