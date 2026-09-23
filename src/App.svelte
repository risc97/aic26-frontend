<script lang="ts">
  import HeaderNew from './ui/Header.svelte';
  import ConfigModal from './ui/ConfigModal.svelte';
  import AuthModal from './ui/AuthModal.svelte';
  import SingleSearch from './ui/SingleSearch.svelte';
  import MultipleSearch from './ui/MultipleSearch.svelte';
  import Review from './ui/Review.svelte';
    import { auth } from './lib/auth.svelte';

  let mode = $state('single');
  let isConfigOpen = $state(false);
</script>

<script module lang="ts">
  declare const __BUILD_COMMIT__: string;
  declare const __BUILD_DATE__: string;
</script>

<div inert={!auth.isAuthenticated ? true : undefined} class="min-h-screen">
  <div class="h-screen flex flex-col overflow-hidden bg-slate-50">
    <div class="sticky top-0 z-30">
      <HeaderNew 
        bind:mode={mode} 
        onOpenConfigModal={() => isConfigOpen = true} 
      />
    </div>

    <main class="min-h-0 flex-1 overflow-y-auto px-2 py-4">
      <div class="flex min-h-full flex-col">
        {#if mode === 'single'}
          <SingleSearch />
        {:else if mode === 'multiple'}
          <MultipleSearch />
        {:else if mode === 'logs'}
          <!-- Logs mode view placeholder -->
        {/if}

        <div class={mode === 'review' ? 'contents' : 'hidden'}>
          <Review isActive={mode === 'review'} />
        </div>

        <footer class="flex justify-between items-center px-4 py-1 select-none mt-auto shrink-0 bg-slate-50 text-slate-500">
          <div class="text-xs">
            Commit {__BUILD_COMMIT__} · Build date {__BUILD_DATE__}
          </div>
          <div class="flex items-center gap-1 font-semibold font-mono text-xs">
            <span>CISC97 · </span>
            <a href="https://github.com/hydroshiba" target="_blank" rel="noopener noreferrer" class="hover:underline hover:text-slate-700">@hydroshiba</a> ·  
            <a href="https://github.com/tb-tian" target="_blank" rel="noopener noreferrer" class="hover:underline hover:text-slate-700">@tian</a> ·  
            <a href="https://github.com/zeeptobean" target="_blank" rel="noopener noreferrer" class="hover:underline hover:text-slate-700">@zeept</a> ·  
            <a href="https://github.com/DVG3" target="_blank" rel="noopener noreferrer" class="hover:underline hover:text-slate-700">@dvg3</a> ·  
            <a href="https://github.com/callmelucian" target="_blank" rel="noopener noreferrer" class="hover:underline hover:text-slate-700">@callmelucian</a>
          </div>
        </footer>
      </div>
    </main>

    <ConfigModal bind:open={isConfigOpen} />
    
    <!-- Add Auth Modal -->
    <AuthModal />
  </div>
</div>