<script lang="ts">
  import { config } from '../lib/config.svelte';
  import { Tabs, Tooltip, Toggle } from "bits-ui";
  import { mockConfig } from '../lib/mock.svelte';
  import { appState } from '../lib/appState.svelte';
  import { BORDER_STYLE, ACCENT_PALETTES, PRESSED_ANIM } from './common/CommonStyle';
  import { CpuIcon, GearIcon, QuestionIcon, ClockCounterClockwiseIcon } from 'phosphor-svelte';
    import { singleSearch } from '../lib/singleSearchImpl.svelte';
    import { multipleSearch } from '../lib/multipleSearchImpl.svelte';

  interface HeaderProps {
    onOpenConfigModal: () => void;
    onOpenHistoryModal: () => void;
    mode: string;
  }

  let {
    onOpenConfigModal,
    onOpenHistoryModal,
    mode = $bindable('single'),
  }: HeaderProps = $props();

  // Dynamically change logo background based on active mode
  let logoBg = $derived.by(() => {
    switch (mode) {
      case 'single': return ACCENT_PALETTES.blue.bg;
      case 'multiple': return ACCENT_PALETTES.rose.bg;
      case 'review': return ACCENT_PALETTES.emerald.bg;
      case 'logs': return ACCENT_PALETTES.amber.bg;
    }
  });

  function getActiveColorClass(m: string, active: boolean) {
    if (!active) return 'bg-transparent text-slate-700 hover:bg-slate-200';
    switch (m) {
      case 'single': return `${ACCENT_PALETTES.blue.bg} text-white`;
      case 'multiple': return `${ACCENT_PALETTES.rose.bg} text-white`;
      case 'review': return `${ACCENT_PALETTES.emerald.bg} text-white`;
      case 'logs': return `${ACCENT_PALETTES.amber.bg} text-white`;
    }
  }
</script>

<header class="z-20 shrink-0 border-b-2 border-neutral-900 bg-white select-none transition-colors duration-200">
  <div class="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-1.5">

    <!-- Left: Brand -->
    <div class="flex shrink-0 items-center gap-2 justify-self-start">
      <div class={`flex h-11 w-11 shrink-0 items-center justify-center ${BORDER_STYLE} text-white transition-colors duration-200 ${logoBg}`}>
        <CpuIcon size="24px"/>
      </div>
      <h1 class="text-xl font-bold tracking-tight text-slate-900">CISC97</h1>
    </div>

    <!-- Center: Mode Switcher -->
    <div class="flex shrink-0 items-center justify-self-center gap-2">
      <Tabs.Root
        value={mode}
        onValueChange={(val) => {
          if (val) {
            mode = val;
          }
        }}
      >
        <Tabs.List class="flex {BORDER_STYLE} bg-slate-100 p-0.5">
          <Tabs.Trigger
            value="single"
            class={`px-3 py-1.5 text-sm font-semibold transition-colors ${PRESSED_ANIM} outline-none ${getActiveColorClass('single', mode === 'single')}`}
          >
            Single
          </Tabs.Trigger>
          <Tabs.Trigger
            value="multiple"
            class={`px-3 py-1.5 text-sm font-semibold transition-colors ${PRESSED_ANIM} outline-none ${getActiveColorClass('multiple', mode === 'multiple')}`}
          >
            Multiple
          </Tabs.Trigger>
          <Tabs.Trigger
            value="review"
            class={`px-3 py-1.5 text-sm font-semibold transition-colors ${PRESSED_ANIM} outline-none ${getActiveColorClass('review', mode === 'review')}`}
          >
            Review
          </Tabs.Trigger>
          <Tabs.Trigger
            value="logs"
            class={`px-3 py-1.5 text-sm font-semibold transition-colors ${PRESSED_ANIM} outline-none ${getActiveColorClass('logs', mode === 'logs')}`}
          >
            Logs
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>

    <!-- Right: Config & Status -->
    <div class="flex shrink-0 items-center gap-6 justify-self-end">
    {#if mode === 'single' || mode === 'multiple'}
      <Toggle.Root
        pressed={appState.qaEnabled}
        onPressedChange={(enabled) => {
          appState.qaEnabled = enabled;
          if (!enabled) {
            singleSearch.qaAnswer = '';
            multipleSearch.qaAnswer = '';
          }
        }}
        aria-label="Toggle QA mode"
        title="Toggle QA mode"
        class="flex h-8 w-16 gap-2 items-center justify-center {BORDER_STYLE} font-sm font-semibold data-[state=on]:bg-emerald-500 data-[state=on]:text-white {PRESSED_ANIM}"
      >
        <QuestionIcon size="18px" weight="bold" />
        QA
      </Toggle.Root>
    {/if}
      <div class="flex items-center gap-2">
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger
              type="button"
              onclick={onOpenHistoryModal}
              class="flex h-9 w-9 {PRESSED_ANIM} {BORDER_STYLE} items-center justify-center bg-white text-slate-700 hover:bg-slate-100 outline-none"
            >
              <ClockCounterClockwiseIcon size="16px" weight="bold"/>
            </Tooltip.Trigger>
            <Tooltip.Content class="z-50 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-md">
              Submission History
              <Tooltip.Arrow class="border-neutral-900 fill-white" />
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>

        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger
              type="button"
              onclick={onOpenConfigModal}
              class="flex h-9 w-9 {PRESSED_ANIM} {BORDER_STYLE} items-center justify-center bg-white text-slate-700 hover:bg-slate-100 outline-none"
            >
              <GearIcon size="16px" weight="bold"/>
            </Tooltip.Trigger>
            <Tooltip.Content class="z-50 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-md">
              Configuration
              <Tooltip.Arrow class="border-neutral-900 fill-white" />
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
    </div>

  </div>
</header>