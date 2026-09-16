<script lang="ts">
  import {
    MagnifyingGlassIcon,
    PlusIcon,
    SlidersHorizontalIcon,
    SparkleIcon,
    TargetIcon,
    TrashIcon
  } from "phosphor-svelte";
  import { BORDER_STYLE, ACCENT_PALETTES } from "./common/CommonStyle";
  import MyDropdown from "./common/MyDropdown.svelte";
  import { multipleSearch } from "../lib/multipleSearchImpl.svelte";
    import { Toggle } from "bits-ui";

  const MODEL_OPTIONS = [
    { value: "siglip", label: "siglip" },
    { value: "siglip2", label: "siglip2" },
    { value: "pe", label: "pe" }
  ];

  const MODE_OPTIONS = [
    { value: 'semantic', label: 'Semantic', icon: SparkleIcon},
    { value: 'object_detect', label: 'Object Detection', icon: TargetIcon },
  ];

  const rose = ACCENT_PALETTES.rose;
</script>

<div class="min-h-0 flex flex-1 flex-col">
  <div class="flex flex-col gap-2.5 p-2">
    <!-- Each search bar stage -->
    {#each multipleSearch.stages as stage, index (stage.id)}
      <div class="flex h-11 items-center {BORDER_STYLE} {rose.focusRing} bg-white">
        <div class="flex h-full w-12 shrink-0 items-center justify-center {rose.bgSubtle} {rose.text} border-r-2 border-slate-900 text-base font-mono font-bold select-none">
          E{index + 1}
        </div>

        <div class="flex min-w-0 flex-1 items-center gap-2 px-2">
          {#if multipleSearch.searchMode === 'semantic'}
          <MyDropdown
            items={MODEL_OPTIONS}
            bind:value={multipleSearch.semanticModel}
            accent="rose"
          />
          {/if}

          <input
            class="min-w-0 flex-1 bg-transparent px-1 text-lg font-medium text-slate-900 outline-none placeholder:text-slate-400"
            placeholder={`Describe event ${index + 1}...`}
            bind:value={stage.query}
          />
        </div>

        <button
          type="button"
          title="Remove stage"
          disabled={multipleSearch.stages.length === 1}
          onclick={() => multipleSearch.removeStage(stage.id)}
          class="flex h-full w-10 shrink-0 items-center justify-center border-l-2 border-slate-900 text-slate-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <TrashIcon size={18} />
        </button>
      </div>
    {/each}

    <!-- Control area -->
    <div class="flex justify-center w-full px-4">
      <div class="flex items-center justify-center gap-2 w-full max-w-[33.333%]">
        <!-- Add stage button -->
        <button
          type="button"
          onclick={() => multipleSearch.addStage()}
          class="flex h-10 w-30 items-center justify-center gap-1 {BORDER_STYLE} border-dashed {rose.hoverSubtle} text-sm font-semibold transition-colors"
        >
          <PlusIcon size={18} />
          <span class="text-sm font-semibold">Add stage</span>
        </button>

        <!-- Mode Selection -->
        <MyDropdown items={MODE_OPTIONS} bind:value={multipleSearch.searchMode} width="w-48" height="h-10" accent="rose" strong={false}/>
        
        <!-- Filter drawer toggle -->
        <Toggle.Root
          pressed={multipleSearch.showFilterDrawer}
          onPressedChange={(p) => (multipleSearch.showFilterDrawer = p)}
          class="flex h-10 w-30 shrink-0 items-center justify-center gap-1 {BORDER_STYLE} bg-slate-50 {rose.hoverSubtle} active:scale-[0.95] transition-all"
          title="Toggle Filters"
        >
          <SlidersHorizontalIcon size="24px" weight="regular"/>
          <span class="text-sm font-semibold">Config</span>
        </Toggle.Root>

        <!-- Search button -->
         <button
          type="submit"
          disabled={multipleSearch.isSearching}
          onclick={() => multipleSearch.handleSearch()}
          class="flex h-10 w-30 shrink-0 items-center justify-center {BORDER_STYLE} text-white {rose.hover} {rose.bg} outline-none active:scale-[0.95] transition-all"
        >
          {#if multipleSearch.isSearching}
            <span class="h-4 w-4 animate-spin border-2 border-white border-t-transparent"></span>
          {:else}
            <MagnifyingGlassIcon size="24px" weight="regular"/>
            <span class="text-sm font-semibold">Search</span>
          {/if}
        </button>
        
      </div>
    </div>

    {#if multipleSearch.errorMessage}
      <div class="mb-4 {BORDER_STYLE} bg-rose-100 p-4 text-sm font-semibold text-rose-800">
        Error: {multipleSearch.errorMessage}
      </div>
    {/if}

  </div>
</div>