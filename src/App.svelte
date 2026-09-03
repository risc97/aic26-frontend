<script lang="ts">
  import HeaderNew from './ui/Header_new.svelte';
  import ConfigModal from './ui/ConfigModal.svelte';
  import SingleSearch from './ui/SingleSearch.svelte';
  // ... other imports and state ...

  let mode = $state('single');
  let isConfigOpen = $state(false);
</script>

<HeaderNew 
  {mode} 
  setMode={(m) => mode = m} 
  onOpenConfigModal={() => isConfigOpen = true} 
/>

<main class="flex-1 overflow-hidden">
  {#if mode === 'single'}
    <SingleSearch />
  {/if}
  <!-- other views -->
</main>

<ConfigModal 
  bind:open={isConfigOpen} 
/>