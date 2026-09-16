<script lang="ts">
  import { Select } from "bits-ui";
  import { BORDER_STYLE, BORDER_STYLE_LIGHT, ACCENT_PALETTES } from "./CommonStyle";
  import type { Component } from "svelte";

  export interface SelectOption {
    value: string;
    label: string;
    icon?: Component<any>;
  }

  const ACCENT_STYLES = {
    blue: {
      strong: `text-sm font-sans font-semibold text-white ${ACCENT_PALETTES.blue.bg} ${ACCENT_PALETTES.blue.hover}`,
      subtle: `text-xs font-mono font-semibold text-slate-900 ${ACCENT_PALETTES.blue.bgSubtle} ${ACCENT_PALETTES.blue.hoverSubtle}`,
    },
    rose: {
      strong: `text-sm font-sans font-semibold text-white ${ACCENT_PALETTES.rose.bg} ${ACCENT_PALETTES.rose.hover}`,
      subtle: `text-xs font-mono font-semibold text-slate-900 ${ACCENT_PALETTES.rose.bgSubtle} ${ACCENT_PALETTES.rose.hoverSubtle}`,
    },
    emerald: {
      strong: `text-sm font-sans font-semibold text-white ${ACCENT_PALETTES.emerald.bg} ${ACCENT_PALETTES.emerald.hover}`,
      subtle: `text-xs font-mono font-semibold text-slate-900 ${ACCENT_PALETTES.emerald.bgSubtle} ${ACCENT_PALETTES.emerald.hoverSubtle}`,
    },
    amber: {
      strong: `text-sm font-sans font-semibold text-white ${ACCENT_PALETTES.amber.bg} ${ACCENT_PALETTES.amber.hover}`,
      subtle: `text-xs font-mono font-semibold text-slate-900 ${ACCENT_PALETTES.amber.bgSubtle} ${ACCENT_PALETTES.amber.hoverSubtle}`,
    },
  };

  interface Props {
    items: SelectOption[];
    value: string;
    width?: string;
    height?: string;
    accent?: "blue" | "rose" | "emerald" | "amber";
    strong?: boolean;
    class?: string;
  }

  let {
    items = [],
    value = $bindable(),
    width = "w-32",
    height = "h-7",
    accent = "blue",
    strong = false,
    class: className = "",
  }: Props = $props();

  let activeItem = $derived(items.find((item) => item.value === value));
  let accentClass = $derived(ACCENT_STYLES[accent][strong ? "strong" : "subtle"]);
  let highlightClass = $derived(ACCENT_PALETTES[accent].highlight);
</script>

<Select.Root type="single" {items} bind:value>
  <Select.Trigger
    class="inline-flex {accentClass} {BORDER_STYLE} {height} {width} items-center justify-between px-1.5 transition-colors focus:outline-none {className}"
    aria-label="Select Model"
  >
    <span class="inline-flex items-center gap-1.5 truncate">
      {#if activeItem?.icon}
        {@const ActiveIcon = activeItem.icon}
        <ActiveIcon class="shrink-0" size={15} weight="bold" />
      {/if}
      <span class="truncate">{activeItem?.label ?? value}</span>
    </span>
    <span class="ml-1 text-xs shrink-0">▾</span>
  </Select.Trigger>

  <Select.Portal>
    <Select.Content
      class="z-50 w-(--bits-select-anchor-width) overflow-hidden {BORDER_STYLE_LIGHT} bg-white p-0 shadow-md animate-in fade-in-80"
      sideOffset={2}
      align="start"
    >
      {#each items as item (item.value)}
        {@const ItemIcon = item.icon}
        <Select.Item
          value={item.value}
          label={item.label}
          class="flex cursor-pointer select-none items-center gap-2 px-1 py-1 text-xs text-slate-800 outline-none {highlightClass} {strong ? 'font-sans font-semibold' : 'font-mono'}"
        >
          {#if ItemIcon}
            <ItemIcon class="shrink-0" size={14} weight="bold" />
          {/if}
          <span class="truncate">{item.label}</span>
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Portal>
</Select.Root>