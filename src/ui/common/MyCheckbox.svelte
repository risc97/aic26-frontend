<script lang="ts">
  import { Checkbox } from "bits-ui";
  import Check from "phosphor-svelte/lib/Check";

  const ACCENT_STYLES = {
    blue: {
      strong: "text-sm text-white bg-blue-500 hover:bg-blue-500/80",
      subtle: "text-xs text-blue-700 bg-blue-100/80 hover:bg-blue-200/80",
    },
    rose: {
      strong: "text-sm text-white bg-rose-500 hover:bg-rose-500/80",
      subtle: "text-xs text-rose-700 bg-rose-100/80 hover:bg-rose-200/80",
    },
    emerald: {
      strong: "text-sm text-white bg-emerald-500 hover:bg-emerald-500/80",
      subtle: "text-xs text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200/80",
    },
    amber: {
      strong: "text-sm text-white bg-amber-500 hover:bg-amber-500/80",
      subtle: "text-xs text-amber-800 bg-amber-100/80 hover:bg-amber-200/80",
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
  class="inline-flex {accentClass} {height} cursor-pointer select-none items-center gap-1.5 rounded border-2 border-slate-900 px-1.5 font-semibold transition-colors focus-within:ring-2 focus-within:ring-slate-900/20 {disabled ? 'cursor-not-allowed opacity-50' : ''} {className}"
>
  <Checkbox.Root
    {id}
    bind:checked
    {disabled}
    class="flex size-3 shrink-0 items-center justify-center rounded-[3px] border border-slate-700 bg-white transition-colors focus-visible:outline-none"
  >
  {#if checked}
    <div class="text-background inline-flex items-center justify-center">
      <Check class="size-sm" weight="bold" />
    </div>
  {/if}
  </Checkbox.Root>

  <span class="truncate">{label}</span>
</label>