<script lang="ts">
  import { Select } from "bits-ui";

  export interface SelectOption {
    value: string;
    label: string;
  }

  const ACCENT_STYLES = {
    blue: {
      strong: "text-sm font-medium font-semibold text-white bg-blue-500 hover:bg-blue-500/80",
      subtle: "text-xs font-mono font-semibold text-slate-900 bg-blue-100/80 hover:bg-blue-200/80",
    },
    rose: {
      strong: "text-sm font-medium text-white bg-rose-500 hover:bg-rose-500/80",
      subtle: "text-xs font-mono font-semibold text-slate-900 bg-rose-100/80 hover:bg-rose-200/80",
    },
    emerald: {
      strong: "text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-500/80",
      subtle: "text-xs font-mono font-semibold text-slate-900 bg-emerald-100/80 hover:bg-emerald-200/80",
    },
    amber: {
      strong: "text-sm font-medium text-white bg-amber-500 hover:bg-amber-500/80",
      subtle: "text-xs font-mono font-semibold text-slate-900 bg-amber-100/80 hover:bg-amber-200/80",
    },
  }
  const HIGHLIGHT_STYLES = {
    blue: "data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700",
    rose: "data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700",
    emerald: "data-[highlighted]:bg-emerald-50 data-[highlighted]:text-emerald-700",
    amber: "data-[highlighted]:bg-amber-50 data-[highlighted]:text-amber-700",
  }

  interface Props {
    items: SelectOption[];
    value: string;
    width?: string;
    height?: string;
    accent?: 'blue' | 'rose' | 'emerald' | 'amber';
    strong?: boolean;
    class?: string;
  }

  let {
    items = [],
    value = $bindable(),
    width = "w-22",
    height = "h-6",
    accent = "blue",
    strong = false,
    class: className = "",
  }: Props = $props();

  let activeLabel = $derived(
    items.find((item) => item.value === value)?.label ?? value
  );
  
  let accentClass = $derived(ACCENT_STYLES[accent][strong ? 'strong' : 'subtle']);
  let highlightClass = $derived(HIGHLIGHT_STYLES[accent]);
</script>

<Select.Root type="single" {items} bind:value>
  <Select.Trigger
    class="inline-flex {accentClass} {height} {width} items-center justify-between rounded border-2 border-slate-900 px-1 transition-colors focus:outline-none {className}"
    aria-label="Select Model"
  >
    <span class="truncate">{activeLabel}</span>
    <span class="ml-2">▾</span>
  </Select.Trigger>

  <Select.Portal>
    <Select.Content
      class="z-50 {width} overflow-hidden rounded border-2 border-slate-300 bg-white p-0 shadow-md animate-in fade-in-80"
      sideOffset={0}
      align="start"
    >
      {#each items as item (item.value)}
        <Select.Item
          value={item.value}
          label={item.label}
          class="flex cursor-pointer select-none items-center px-1 py-0.5 font-mono text-sm text-slate-800 outline-none {highlightClass}"
        >
          <span class="truncate">{item.label}</span>
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Portal>
</Select.Root>