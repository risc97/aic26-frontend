<script lang="ts">
  import { config } from '../lib/config.svelte';
  import { Tabs, Tooltip } from "bits-ui";

  let { 
    onOpenConfigModal, 
    mode = 'single', 
    setMode 
  }: { 
    onOpenConfigModal: () => void;
    mode?: string;
    setMode: (m: string) => void;
  } = $props();

  // Dynamically change logo background based on active mode
  let logoBg = $derived.by(() => {
    switch (mode) {
      case 'single': return 'bg-blue-600';
      case 'multiple': return 'bg-rose-600';
      case 'submit': return 'bg-emerald-600';
      case 'logs': return 'bg-amber-500';
      default: return 'bg-neutral-900';
    }
  });

  let statusDot = $derived.by(() => {
    if (config.apiPending) return 'bg-yellow-400 animate-pulse';
    if (config.apiConnected) return 'bg-emerald-500';
    return 'bg-rose-600';
  });

  function getActiveColorClass(m: string, active: boolean) {
    if (!active) return 'bg-transparent text-slate-700 hover:bg-slate-200';
    switch (m) {
      case 'single': return 'bg-blue-600 text-white';
      case 'multiple': return 'bg-rose-600 text-white';
      case 'submit': return 'bg-emerald-600 text-white';
      case 'logs': return 'bg-amber-500 text-white';
      default: return 'bg-neutral-900 text-white';
    }
  }
</script>

<header class="z-20 shrink-0 border-b-2 border-neutral-900 bg-white select-none transition-colors duration-200">
  <div class="flex w-full items-start gap-4 px-5 py-3">

    <!-- Left: Brand -->
    <div class="flex shrink-0 items-center gap-2">
      <div class={`flex h-11 w-11 shrink-0 items-center justify-center border-2 border-neutral-900 text-white transition-colors duration-200 ${logoBg}`}>
        <svg class="h-5 w-5 fill-current" viewBox="0 0 24 24">
          <path d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h16V5H4zm2 2h2v2H6V7zm4 0h8v2h-8V7zm-4 4h2v2H6v-2zm4 0h8v2h-8v-2zm-4 4h2v2H6v-2zm4 0h8v2h-8v-2z"/>
        </svg>
      </div>
      <h1 class="text-xl font-bold tracking-tight text-slate-900">CISC97</h1>
    </div>

    <!-- Center: Mode Switcher (Bits UI Tabs with bind:value & onValueChange) -->
    <div class="flex shrink-0 items-center gap-2">
      <Tabs.Root 
        value={mode} 
        onValueChange={(val) => {
          if (val) {
            mode = val;
            setMode(val);
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
            Temporal
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

    <!-- Right: Config & Status with Bits UI Tooltip -->
    <div class="flex shrink-0 items-center gap-2 ml-auto">
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            type="button"
            onclick={onOpenConfigModal}
            class="flex h-9 w-9 items-center justify-center border-2 border-neutral-900 bg-white text-slate-700 hover:bg-slate-100 outline-none"
          >
            ⚙️
          </Tooltip.Trigger>
          <Tooltip.Content class="z-50 border-2 border-neutral-900 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-md">
            API Request Configuration
            <Tooltip.Arrow class="border-neutral-900 fill-white" />
          </Tooltip.Content>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger
            type="button"
            onclick={onOpenConfigModal}
            class="flex h-9 w-9 items-center justify-center hover:bg-slate-100 outline-none"
          >
            <span class={`h-3.5 w-3.5 border border-slate-400 ${statusDot}`}></span>
          </Tooltip.Trigger>
          <Tooltip.Content class="z-50 border-2 border-neutral-900 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-md">
            Backend: {config.baseUrl} ({config.apiConnected ? 'Online' : 'Offline'})
            <Tooltip.Arrow class="border-neutral-900 fill-white" />
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>

  </div>
</header>