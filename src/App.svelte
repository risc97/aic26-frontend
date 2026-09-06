<script lang="ts">
  import HeaderNew from './ui/Header.svelte';
  import ConfigModal from './ui/ConfigModal.svelte';
  import SingleSearch from './ui/SingleSearch.svelte';
  import MultipleSearch from './ui/MultipleSearch.svelte';
  import Review from './ui/Review.svelte';

  let mode = $state('single');
  let isConfigOpen = $state(false);
</script>

<HeaderNew 
  bind:mode={mode} 
  onOpenConfigModal={() => isConfigOpen = true} 
/>

<main class="flex-1 overflow-hidden">
  {#if mode === 'single'}
    <SingleSearch />
  {:else if mode === 'multiple'}
    <!-- Temporal mode view placeholder -->
  {:else if mode === 'submit'}
    <!-- Review mode view placeholder -->
  {:else if mode === 'logs'}
    <!-- Logs mode view placeholder -->
  {/if}
</main>

<ConfigModal 
  bind:open={isConfigOpen} 
/>