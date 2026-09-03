<script lang="ts">
  import './app.css';
  import Header from './ui/header.svelte';
  import { Dialog } from 'bits-ui';
  import { fade, scale } from 'svelte/transition';
</script>

<Header />

<Dialog.Root>
  <Dialog.Trigger class="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
    Open Modal
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay forceMount>
      {#snippet child({ props, open })}
        {#if open}
          <div
            {...props}
            transition:fade={{ duration: 150 }}
            class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          ></div>
        {/if}
      {/snippet}
    </Dialog.Overlay>
    
    <Dialog.Content forceMount>
      {#snippet child({ props, open })}
        {#if open}
          <div
            {...props}
            transition:scale={{ start: 0.95, duration: 150 }}
            class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg"
          >
            <Dialog.Title class="text-lg font-semibold text-neutral-900">
              Account Settings
            </Dialog.Title>
            <Dialog.Description class="mt-2 text-sm text-neutral-600">
              Manage your profile settings and preferences.
            </Dialog.Description>
            <div class="mt-4 flex justify-end">
              <Dialog.Close class="rounded bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-300">
                Close
              </Dialog.Close>
            </div>
          </div>
        {/if}
      {/snippet}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>