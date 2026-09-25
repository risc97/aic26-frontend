<script lang="ts">
  import HeaderNew from './ui/Header.svelte';
  import ConfigModal from './ui/ConfigModal.svelte';
  import AuthModal from './ui/AuthModal.svelte';
  import SingleSearch from './ui/SingleSearch.svelte';
  import MultipleSearch from './ui/MultipleSearch.svelte';
  import Review from './ui/Review.svelte';
  import SubmissionHistoryModal from './ui/SubmissionHistoryModal.svelte';
  import { auth } from './lib/auth.svelte';
  import { Toaster} from 'svelte-sonner'
    import Logs from './ui/Logs.svelte';

  let mode = $state('single');
  let isConfigOpen = $state(false);
  let isHistoryOpen = $state(false);
</script>

<script module lang="ts">
  declare const __BUILD_COMMIT__: string;
  declare const __BUILD_DATE__: string;
</script>

<Toaster
  position="bottom-right"
  richColors
  closeButton
  style="z-index: 9999;"
/>

{#snippet Credit()}
<footer class="flex justify-between items-center px-2 select-none mt-auto shrink-0 bg-slate-50 text-slate-500">
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
{/snippet}

<div inert={!auth.isAuthenticated ? true : undefined} class="min-h-screen">
  <div class="h-screen flex flex-col overflow-hidden bg-slate-50">
    <div class="sticky top-0 z-30">
      <HeaderNew
        bind:mode={mode}
        onOpenConfigModal={() => isConfigOpen = true}
        onOpenHistoryModal={() => isHistoryOpen = true}
      />
    </div>

    <main class="min-h-0 flex-1 p-2 {mode === 'review' || mode === 'logs' ? 'overflow-hidden' : 'overflow-y-auto'}">
      <div class="flex flex-col {mode === 'review' || mode === 'logs' ? 'h-full' : 'min-h-full'}">
        {#if mode === 'single'}
          <SingleSearch />
        {:else if mode === 'multiple'}
          <MultipleSearch />
        {/if}

        <div class={mode === 'review' ? 'contents' : 'hidden'}>
          <Review isActive={mode === 'review'} />
        </div>
        <div class={mode === 'logs' ? 'contents' : 'hidden'}>
          <Logs />
        </div>

        {#if mode === 'single' || mode === 'multiple'}
          {@render Credit()}
        {/if}
      </div>
    </main>

    <ConfigModal bind:open={isConfigOpen} />

    <SubmissionHistoryModal bind:open={isHistoryOpen} />

    <AuthModal />
  </div>
</div>