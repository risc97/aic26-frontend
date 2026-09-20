<script lang="ts">
  import { Dialog, Button } from "bits-ui";
  import { auth } from '../lib/auth.svelte';
    import { BORDER_STYLE, PRESSED_ANIM } from "./common/CommonStyle";

  let password = $state("");
  let errorMessage = $state("");
  let isSubmitting = $state(false);

  async function handleLogin(e: Event) {
    e.preventDefault();
    isSubmitting = true;
    errorMessage = "";

    const success = await auth.verifyAndLogin(password);
    errorMessage = success[1];
    if (success[0]) {
      password = "";
    }
    isSubmitting = false;
  }
</script>

<Dialog.Root open={!auth.isAuthenticated}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl" />
    <Dialog.Content class="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 {BORDER_STYLE} bg-white p-6 shadow-xl" onInteractOutside={(e) => {
        e.preventDefault();
      }}>
      <Dialog.Title class="text-lg font-bold text-slate-900 select-none">Authentication Required</Dialog.Title>
      <form onsubmit={handleLogin} class="mt-4 flex flex-col gap-3">
        <div>
          <p class="block text-sm font-medium text-slate-700 select-none">Password</p>
          <input 
            type="password" 
            bind:value={password} 
            placeholder="Enter password..."
            class="mt-1 w-full {BORDER_STYLE} p-2 text-sm outline-none focus:ring-1 focus:ring-slate-900" 
            required
          />
        </div>

        {#if errorMessage}
          <p class="text-sm font-semibold text-rose-600 select-none">{errorMessage}</p>
        {/if}

        <Button.Root 
          type="submit"
          disabled={isSubmitting}
          class="mt-2 w-full {BORDER_STYLE} {PRESSED_ANIM} bg-neutral-900 py-2 text-sm font-semibold text-white hover:bg-neutral-800 active:bg-neutral-950 disabled:opacity-50 outline-none"
        >
          {isSubmitting ? 'Verifying...' : 'Login'}
        </Button.Root>
      </form>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>