<script lang="ts">
  import { Dialog, Button } from "bits-ui";
  import { config } from '../lib/config.svelte';
  import { mockConfig } from '../lib/mock.svelte';
  import { BORDER_STYLE, ACCENT_PALETTES, PRESSED_ANIM } from "./common/CommonStyle";
  import { auth } from "../lib/auth.svelte";

  let { open = $bindable(false) }: { open: boolean } = $props();

  async function handleCheckConnection() {
    await config.checkHealth();
  }

  async function handleLogout() {
    open = false;
    setTimeout(() => {
      auth.logout();
    }, 50);
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 bg-black/50"
    />
    <Dialog.Content class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 {BORDER_STYLE} bg-white p-6 shadow-xl">
      <Dialog.Title class="text-lg font-bold select-none">Configuration</Dialog.Title>

      <div class="flex items-center space-x-2 my-4  pointer-events-none opacity-50 select-none cursor-not-allowed">
        <input type="checkbox" id="mock-mode" bind:checked={mockConfig.enabled} class="rounded border-gray-700" />
        <label for="mock-mode" class="text-sm font-medium">Enable Testing mode</label>
      </div>
      
      <div class="mt-4 flex flex-col gap-3">
        <div>
          <span class="block text-sm font-medium text-slate-700 select-none">Base URL</span>
          <input 
            type="text" 
            bind:value={config.baseUrl} 
            class="mt-1 w-full p-2 text-sm {BORDER_STYLE}" 
          />
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs font-semibold">
            <span class={`h-3 w-3 border border-slate-400 ${config.apiPending ? 'bg-yellow-400 animate-pulse' : config.apiConnected ? 'bg-emerald-500' : 'bg-rose-600'}`}></span>
            <span>Status: {config.apiPending ? 'Checking...' : config.apiConnected ? 'Online' : 'Offline'}</span>
          </div>

          <Button.Root 
            onclick={handleCheckConnection}
            disabled={config.apiPending}
            class="{BORDER_STYLE} {PRESSED_ANIM} bg-slate-100 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 outline-none"
          >
            {config.apiPending ? 'Checking...' : 'Check'}
          </Button.Root>
        </div>

        <button 
          onclick={() => handleLogout()}
          class="{BORDER_STYLE} mt-4 p-1 text-sm font-semibold select-none {ACCENT_PALETTES.rose.bg} {ACCENT_PALETTES.rose.hover} {PRESSED_ANIM} text-white"
        >
          Logout
        </button>
      </div>

      <Dialog.Close class="absolute right-4 top-4 p-1 text-sm font-bold {PRESSED_ANIM} {BORDER_STYLE}">
        ✕
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>