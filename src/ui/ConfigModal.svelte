<script lang="ts">
  import { Dialog } from "bits-ui";
  import { config } from '../lib/config.svelte';

  let { open = $bindable(false) }: { open: boolean } = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
    <Dialog.Content class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border-2 border-neutral-900 bg-white p-6 shadow-xl">
      <Dialog.Title class="text-lg font-bold">API Configuration</Dialog.Title>
      
      <!-- Your configuration inputs using config.baseUrl, etc. -->
      <div class="mt-4">
        <label class="block text-sm font-medium text-slate-700">Base URL</label>
        <input 
          type="text" 
          bind:value={config.baseUrl} 
          class="mt-1 w-full border-2 border-neutral-900 p-2 text-sm outline-none" 
        />
      </div>

      <Dialog.Close class="absolute right-4 top-4 border-2 border-neutral-900 px-2 py-1 text-sm font-bold">
        ✕
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>