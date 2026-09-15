<script lang="ts">
  import { config } from '../lib/config.svelte';
  import { Tabs, Tooltip } from "bits-ui";
  import { mockConfig } from '../lib/mock.svelte';
  import { BORDER_STYLE, ACCENT_PALETTES } from './common/CommonStyle';
  import { CpuIcon, GearIcon } from 'phosphor-svelte';

  interface HeaderProps {
    onOpenConfigModal: () => void;
    mode: string;
  }

  let { 
    onOpenConfigModal, 
    mode = $bindable('single'), 
  }: HeaderProps = $props();

  // Dynamically change logo background based on active mode
  let logoBg = $derived.by(() => {
    switch (mode) {
      case 'single': return ACCENT_PALETTES.blue.bg;
      case 'multiple': return ACCENT_PALETTES.rose.bg;
      case 'submit': return ACCENT_PALETTES.emerald.bg;
      case 'logs': return ACCENT_PALETTES.amber.bg;
    }
  });

  let statusDot = $derived.by(() => {
    if (mockConfig.enabled) return 'bg-blue-400';
    if (config.apiPending) return 'bg-yellow-400 animate-pulse';
    if (config.apiConnected) return 'bg-emerald-500';
    return 'bg-rose-600';
  });

  function getActiveColorClass(m: string, active: boolean) {
    if (!active) return 'bg-transparent text-slate-700 hover:bg-slate-200';
    switch (m) {
      case 'single': return `${ACCENT_PALETTES.blue.bg} text-white`;
      case 'multiple': return `${ACCENT_PALETTES.rose.bg} text-white`;
      case 'submit': return `${ACCENT_PALETTES.emerald.bg} text-white`;
      case 'logs': return `${ACCENT_PALETTES.amber.bg} text-white`;
    }
  }
</script>

<header class="z-20 shrink-0 border-b-2 border-neutral-900 bg-white select-none transition-colors duration-200">
  <div class="flex w-full items-center justify-between gap-4 px-5 py-1.5">

    <!-- Left: Brand -->
    <div class="flex shrink-0 items-center gap-2">
      <div class={`flex h-11 w-11 shrink-0 items-center justify-center ${BORDER_STYLE} text-white transition-colors duration-200 ${logoBg}`}>
        <CpuIcon size="24px"/>
      </div>
      <h1 class="text-xl font-bold tracking-tight text-slate-900">CISC97</h1>
    </div>

    <!-- Center: Mode Switcher -->
    <div class="flex shrink-0 items-center gap-2">
      <Tabs.Root 
        value={mode} 
        onValueChange={(val) => {
          if (val) {
            mode = val;
          }
        }}
      >
        <Tabs.List class="flex border-2 border-neutral-900 bg-slate-100 p-0.5">
          <Tabs.Trigger
            value="single"
            class={`px-3 py-1.5 text-sm font-semibold transition-colors outline-none ${getActiveColorClass('single', mode === 'single')}`}
          >
            Single
          </Tabs.Trigger>
          <Tabs.Trigger
            value="multiple"
            class={`px-3 py-1.5 text-sm font-semibold transition-colors outline-none ${getActiveColorClass('multiple', mode === 'multiple')}`}
          >
            Multiple
          </Tabs.Trigger>
          <Tabs.Trigger
            value="submit"
            class={`px-3 py-1.5 text-sm font-semibold transition-colors outline-none ${getActiveColorClass('submit', mode === 'submit')}`}
          >
            Review
          </Tabs.Trigger>
          <Tabs.Trigger
            value="logs"
            class={`px-3 py-1.5 text-sm font-semibold transition-colors outline-none ${getActiveColorClass('logs', mode === 'logs')}`}
          >
            Logs
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>

    <!-- Right: Config & Status -->
    <div class="flex shrink-0 items-center gap-2">
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            type="button"
            onclick={onOpenConfigModal}
            class="flex h-9 w-9 items-center justify-center hover:bg-slate-100 outline-none"
          >
            <span class={`h-3.5 w-3.5 border border-slate-400 ${statusDot}`}></span>
          </Tooltip.Trigger>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger
            type="button"
            onclick={onOpenConfigModal}
            class="flex h-9 w-9 items-center justify-center border-2 border-neutral-900 bg-white text-slate-700 hover:bg-slate-100 outline-none"
          >
            <GearIcon size="16px" weight="bold"/>
          </Tooltip.Trigger>
          <Tooltip.Content class="z-50 border-2 border-neutral-900 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-md">
            API Request Configuration
            <Tooltip.Arrow class="border-neutral-900 fill-white" />
          </Tooltip.Content>
        </Tooltip.Root>

      </Tooltip.Provider>
    </div>

  </div>
</header>