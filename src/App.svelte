<script lang="ts">
  import HeaderNew from './ui/Header.svelte';
  import ConfigModal from './ui/ConfigModal.svelte';
  import SingleSearch from './ui/SingleSearch.svelte';
  import MultipleSearch from './ui/MultipleSearch.svelte';
  import Review from './ui/Review.svelte';

  let mode = $state('single');
  let isConfigOpen = $state(false);
</script>

<div class="h-screen flex flex-col overflow-hidden bg-slate-50">
  <div class="sticky top-0 z-30">
    <HeaderNew 
      bind:mode={mode} 
      onOpenConfigModal={() => isConfigOpen = true} 
    />
  </div>

  <main class="min-h-0 flex-1 flex flex-col px-2 py-4 overflow-y-scroll">
    {#if mode === 'single'}
      <SingleSearch />
    {:else if mode === 'multiple'}
      <MultipleSearch />
    <!-- {:else if mode === 'review'} -->
      <!-- <Review /> -->
    {:else if mode === 'logs'}
      <!-- Logs mode view placeholder -->
    {/if}

    <!-- Review remains mounted: video buffer & state stay intact -->
    <div class={mode === 'review' ? 'contents' : 'hidden'}>
      <Review isActive={mode === 'review'} />
    </div>
  </main>

  <ConfigModal 
    bind:open={isConfigOpen} 
  />
</div>