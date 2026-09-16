<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { BORDER_STYLE, ACCENT_PALETTES } from "./CommonStyle";

  type Accent = "blue" | "rose" | "emerald" | "amber";
  type Layout = "horizontal" | "vertical";

  interface Props extends HTMLInputAttributes {
    layout?: Layout;
    label?: string;
    value?: string | number | null;
    accent?: Accent;
    width?: string;
    height?: string;
    class?: string;
  }

  let {
    layout = "horizontal",
    label = "",
    value = $bindable(""),
    accent = "blue",
    width = "w-full",
    height = "h-7",
    class: className = "",
    type = "text",
    disabled = false,
    ...restProps
  }: Props = $props();

  let bgClass = $derived(ACCENT_PALETTES[accent].bgSubtle);
  let labelColorClass = $derived(ACCENT_PALETTES[accent].text);
  let focusRingClass = $derived(ACCENT_PALETTES[accent].focusRing);
</script>

{#if layout === "horizontal"}
  <div class="inline-flex items-center gap-1 {BORDER_STYLE} p-1 {bgClass} {width} {height} {className}">
    {#if label}
      <span class="shrink-0 px-1 text-xs font-sans font-semibold text-slate-900 select-none">
        {label}
      </span>
    {/if}
    <input
      {type}
      bind:value
      {disabled}
      class="h-full min-w-0 flex-1 {BORDER_STYLE} bg-white px-1 text-sm font-mono text-slate-900 outline-none transition-colors {focusRingClass} {disabled ? 'opacity-50 pointer-events-none' : ''} "
      {...restProps}
    />
  </div>
{:else}
  <div class="inline-flex flex-col gap-1 {width} {disabled ? 'opacity-50 pointer-events-none' : ''} {className}">
    {#if label}
      <label for={restProps.id} class="text-xs font-sans font-semibold leading-none {labelColorClass} select-none">
        {label}
      </label>
    {/if}
    <input
      {type}
      bind:value
      {disabled}
      class="w-full {height} {BORDER_STYLE} bg-white px-1 text-xs font-mono text-slate-900 outline-none transition-colors {focusRingClass}"
      {...restProps}
    />
  </div>
{/if}