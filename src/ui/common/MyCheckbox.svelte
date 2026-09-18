<script lang="ts">
  import { Checkbox } from "bits-ui";
  import { BORDER_STYLE, ACCENT_PALETTES } from "./CommonStyle";
  import Check from "phosphor-svelte/lib/Check";

  const ACCENT_STYLES = {
    blue: {
      strong: `text-sm text-white ${ACCENT_PALETTES.blue.bg} ${ACCENT_PALETTES.blue.hover}`,
      subtle: `text-sm text-slate-700 ${ACCENT_PALETTES.blue.bgSubtle} ${ACCENT_PALETTES.blue.hoverSubtle}`,
    },
    rose: {
      strong: `text-sm text-white ${ACCENT_PALETTES.rose.bg} ${ACCENT_PALETTES.rose.hover}`,
      subtle: `text-sm text-slate-700 ${ACCENT_PALETTES.rose.bgSubtle} ${ACCENT_PALETTES.rose.hoverSubtle}`,
    },
    emerald: {
      strong: `text-sm text-white ${ACCENT_PALETTES.emerald.bg} ${ACCENT_PALETTES.emerald.hover}`,
      subtle: `text-sm text-slate-700 ${ACCENT_PALETTES.emerald.bgSubtle} ${ACCENT_PALETTES.emerald.hoverSubtle}`,
    },
    amber: {
      strong: `text-sm text-white ${ACCENT_PALETTES.amber.bg} ${ACCENT_PALETTES.amber.hover}`,
      subtle: `text-sm text-slate-700 ${ACCENT_PALETTES.amber.bgSubtle} ${ACCENT_PALETTES.amber.hoverSubtle}`,
    },
  };

  interface Props {
    label?: string;
    checked?: boolean;
    height?: string;
    accent?: "blue" | "rose" | "emerald" | "amber";
    strong?: boolean;
    disabled?: boolean;
    id?: string;
    class?: string;
  }

  let {
    label = "Phrase",
    checked = $bindable(false),
    height = "h-6",
    accent = "blue",
    strong = false,
    disabled = false,
    id = `checkbox-${Math.random().toString(36).substring(2, 9)}`,
    class: className = "",
  }: Props = $props();

  let accentClass = $derived(ACCENT_STYLES[accent][strong ? "strong" : "subtle"]);
</script>

<label
  for={id}
  class="inline-flex {accentClass} {height} cursor-pointer select-none items-center gap-1.5 {BORDER_STYLE} px-1.5 font-semibold transition-colors {disabled ? 'cursor-not-allowed opacity-50' : ''} {className}"
>
  <Checkbox.Root
    {id}
    bind:checked
    {disabled}
    class="flex size-4 shrink-0 items-center justify-center border rounded bg-white transition-colors focus-visible:outline-none"
  >
  {#if checked}
    <div class="text-background inline-flex items-center justify-center">
      <Check weight="bold"/>
    </div>
  {/if}
  </Checkbox.Root>

  <span class="truncate">{label}</span>
</label>