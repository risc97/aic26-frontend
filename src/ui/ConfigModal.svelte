<script lang="ts">
  import { onMount } from "svelte";
  import { Dialog, Button } from "bits-ui";
  import { config } from '../lib/config.svelte';
  import { mockConfig } from '../lib/mock.svelte';
  import { BORDER_STYLE, ACCENT_PALETTES, PRESSED_ANIM } from "./common/CommonStyle";
  import { auth } from "../lib/auth.svelte";
  import { EyeIcon, EyeSlashIcon } from "phosphor-svelte";
  import { Toaster, toast } from 'svelte-sonner'
  import { dresClient, DresApiError } from "../lib/api";

  let { open = $bindable(false) }: { open: boolean } = $props();

  let showBackendUrl = $state(false);
  let showMediaUrl = $state(false);
  let showSessionId = $state(false);
  let loadEvaluationStatus = $state<"none" | "loading" | "success" | "error">("none");

  // Tracks the last session id we already attempted an auto-load for,
  // so we don't re-fire on every keystroke/blur with the same value.
  let lastAttemptedSessionId = $state("");

  type EndpointKey = "base" | "media";

  function statusLabel(pending: boolean, connected: boolean) {
    if (pending) return "Checking…";
    return connected ? "Online" : "Offline";
  }

  function statusDotClass(pending: boolean, connected: boolean) {
    if (pending) return "bg-amber-400 animate-pulse";
    return connected ? "bg-emerald-500" : "bg-rose-600";
  }

  function handleTest(key: EndpointKey) {
    if (key === "base") config.checkBaseHealth();
    else config.checkMediaHealth();
  }

  function handleCommit(key: EndpointKey) {
    // Re-run normalization/persistence/health-check on blur, since the
    // inputs bind directly to the raw state for a responsive typing feel.
    if (key === "base") config.setBaseUrl(config.baseUrl);
    else config.setMediaUrl(config.mediaUrl);
  }

  async function handleTestAll() {
    await config.checkHealth();
  }

  async function handleLoadEvaluation() {
    try {
      loadEvaluationStatus = "loading";
      const res = await dresClient.getEvaluationList(config.sessionId);
      config.setEvaluationList(res);
      if (res.length === 0) {
        toast.warning("No evaluations found for this session ID.");
        config.setEvaluationId("");
        loadEvaluationStatus = "none";
        return;
      }
      // Keep the current selection if it's still in the refreshed list,
      // otherwise fall back to the first evaluation.
      const stillValid = res.some((e) => e.id === config.evaluationId);
      if (!stillValid) {
        config.evaluationId = res[0].id;
      }
      toast.success(`Loaded ${res.length} evaluation${res.length === 1 ? "" : "s"}.`);
      loadEvaluationStatus = "success";
    } catch (error) {
      if (!(error instanceof DresApiError)) return;
      console.error("Error loading evaluation list:", error);
      toast.error(`Error loading evaluation list: ${error.message}`)
      loadEvaluationStatus = "error";
      return;
    }
  }

  // Auto-loads the evaluation list (and auto-selects the first eval)
  // whenever there's a session id we haven't already tried loading.
  function autoLoadEvaluationIfNeeded() {
    const sid = config.sessionId.trim();
    if (sid && sid !== lastAttemptedSessionId) {
      lastAttemptedSessionId = sid;
      handleLoadEvaluation();
    }
  }

  function handleSessionIdBlur() {
    autoLoadEvaluationIfNeeded();
  }

  function handleSelectEvaluation(e: Event) {
    const id = (e.currentTarget as HTMLSelectElement).value;
    config.evaluationId = id;
    const selected = config.evaluationList.find((ev) => ev.id === id);
    if (selected) {
      toast.success(`Selected evaluation: ${selected.name}`);
    }
  }

  async function handleLogout() {
    config.sessionId = "";
    lastAttemptedSessionId = "";
    open = false;
    setTimeout(() => {
      auth.logout();
    }, 50);
  }

  // If a session id is already present (e.g. restored from localStorage)
  // when the modal first mounts, auto-load its evaluations too.
  onMount(() => {
    autoLoadEvaluationIfNeeded();
  });
</script>


<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
    <Dialog.Content
      class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 {BORDER_STYLE} bg-white p-6 shadow-xl"
      onInteractOutside={(e) => {
        e.preventDefault();
      }}
    >
      <Dialog.Title class="text-lg font-bold select-none pb-3">Configuration</Dialog.Title>

      <div class="flex flex-col gap-1">
        <label for="kis-range-ms" class="text-xs font-semibold text-slate-700 select-none">
          KIS submission range (± ms)
        </label>
        <input
          id="kis-range-ms"
          type="number"
          min="0"
          step="1"
          bind:value={config.kisRangeMs}
          onblur={() => config.setKisRangeMs(config.kisRangeMs)}
          placeholder="10"
          class="min-w-0 flex-1 {BORDER_STYLE} bg-white p-2 text-sm"
        />
      </div>

      <div class="mt-4 flex flex-col gap-2">
        <!-- Backend endpoint -->
        <div class="{BORDER_STYLE} flex flex-col gap-2 bg-slate-50 p-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-semibold">
              <label for="backend-url" class="text-sm font-semibold text-slate-700 select-none">
                Backend URL
              </label>
              <span
                class={`h-2.5 w-2.5 rounded-full border border-slate-400 ${statusDotClass(config.baseApiPending, config.baseApiConnected)}`}
              ></span>
              <span class="text-slate-600 select-none">
                {statusLabel(config.baseApiPending, config.baseApiConnected)}
              </span>
            </div>
            <Button.Root
              onclick={() => handleTest("base")}
              disabled={config.baseApiPending}
              class="{BORDER_STYLE} {PRESSED_ANIM} select-none self-end bg-slate-100 px-3 py-1.5 text-xs font-semibold outline-none hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50"
            >
              {config.baseApiPending ? "Testing…" : "Test"}
            </Button.Root>
          </div>

          <div class="flex gap-2">
            <input
              id="backend-url"
              type={showBackendUrl ? "text" : "password"}
              bind:value={config.baseUrl}
              onblur={() => handleCommit("base")}
              placeholder="http://localhost:3000"
              class="min-w-0 flex-1 {BORDER_STYLE} bg-white p-2 text-sm"
            />

            <Button.Root
              type="button"
              onclick={() => (showBackendUrl = !showBackendUrl)}
              aria-label={showBackendUrl ? "Hide backend URL" : "Show backend URL"}
              title={showBackendUrl ? "Hide backend URL" : "Show backend URL"}
              class="{BORDER_STYLE} {PRESSED_ANIM} px-3 text-xs font-semibold"
            >
              {#if showBackendUrl}
                <EyeSlashIcon size="24px" />
              {:else}
                <EyeIcon size="24px" />
              {/if}
            </Button.Root>
          </div>
        </div>

        <!-- Media endpoint -->
        <div class="{BORDER_STYLE} flex flex-col gap-2 bg-slate-50 p-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-semibold">
              <label for="media-url" class="text-sm font-semibold text-slate-700 select-none">
                Media URL
              </label>
              <span
                class={`h-2.5 w-2.5 rounded-full border border-slate-400 ${statusDotClass(config.mediaApiPending, config.mediaApiConnected)}`}
              ></span>
              <span class="text-slate-600 select-none">
                {statusLabel(config.mediaApiPending, config.mediaApiConnected)}
              </span>
            </div>
            <Button.Root
              onclick={() => handleTest("media")}
              disabled={config.mediaApiPending}
              class="{BORDER_STYLE} {PRESSED_ANIM} select-none self-end bg-slate-100 px-3 py-1.5 text-xs font-semibold outline-none hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50"
            >
              {config.mediaApiPending ? "Testing…" : "Test"}
            </Button.Root>
          </div>

          <div class="flex gap-2">
            <input
              id="media-url"
              type={showMediaUrl ? "text" : "password"}
              bind:value={config.mediaUrl}
              onblur={() => handleCommit("media")}
              placeholder="http://localhost:3000"
              class="min-w-0 flex-1 {BORDER_STYLE} bg-white p-2 text-sm"
            />

            <Button.Root
              type="button"
              onclick={() => (showMediaUrl = !showMediaUrl)}
              aria-label={showMediaUrl ? "Hide media URL" : "Show media URL"}
              title={showMediaUrl ? "Hide media URL" : "Show media URL"}
              class="{BORDER_STYLE} {PRESSED_ANIM} px-3 text-xs font-semibold"
            >
              {#if showMediaUrl}
                <EyeSlashIcon size="24px" />
              {:else}
                <EyeIcon size="24px" />
              {/if}
            </Button.Root>
          </div>
        </div>

        <!-- Session id -->
        <div class="{BORDER_STYLE} flex flex-col gap-2 bg-slate-50 p-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-semibold">
              <label for="session-id" class="text-sm font-semibold text-slate-700 select-none">
                DRES Session ID
              </label>
              <span class="text-xs font-semibold text-slate-500 select-none">
                {config.evaluationId ? `Eval ${config.evaluationId} loaded` : "Eval not loaded"}
              </span>
            </div>
            <Button.Root
              onclick={() => handleLoadEvaluation()}
              class="{BORDER_STYLE} {PRESSED_ANIM} select-none self-end bg-slate-100 px-3 py-1.5 text-xs font-semibold outline-none hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50"
            >
              {config.loadEvaluationStatus === "loading" ? "Loading…" : "Relogon"}
            </Button.Root>
          </div>

          <div class="flex gap-2">
            <input
              id="session-id"
              type={showSessionId ? "text" : "password"}
              bind:value={config.sessionId}
              onblur={handleSessionIdBlur}
              placeholder="Paste a session id"
              class="min-w-0 flex-1 {BORDER_STYLE} bg-white p-2 text-sm"
            />

            <Button.Root
              type="button"
              onclick={() => (showSessionId = !showSessionId)}
              aria-label={showSessionId ? "Hide session id" : "Show session id"}
              title={showSessionId ? "Hide session id" : "Show session id"}
              class="{BORDER_STYLE} {PRESSED_ANIM} px-3 text-xs font-semibold"
            >
              {#if showSessionId}
                <EyeSlashIcon size="24px" />
              {:else}
                <EyeIcon size="24px" />
              {/if}
            </Button.Root>
          </div>

          <!-- Evaluation picker -->
          <div class="flex flex-col gap-1">
            <label for="evaluation-id" class="text-xs font-semibold text-slate-700 select-none">
              Evaluation
            </label>
            <select
              id="evaluation-id"
              value={config.evaluationId}
              onchange={handleSelectEvaluation}
              disabled={config.evaluationList.length === 0}
              class="min-w-0 flex-1 {BORDER_STYLE} bg-white p-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {#if config.evaluationList.length === 0}
                <option value="" disabled selected>No evaluations loaded</option>
              {:else}
                {#each config.evaluationList as evaluation (evaluation.id)}
                  <option value={evaluation.id}>{evaluation.name} ({evaluation.id})</option>
                {/each}
              {/if}
            </select>
          </div>
        </div>

        <Button.Root
          onclick={handleTestAll}
          disabled={config.apiPending}
          class="{BORDER_STYLE} {PRESSED_ANIM} select-none bg-slate-800 hover:bg-slate-900 p-2 text-sm font-semibold text-white outline-none disabled:opacity-50"
        >
          {config.apiPending ? "Testing both…" : "Test both endpoints"}
        </Button.Root>

        <button
          onclick={() => {open = false}}
          class="{BORDER_STYLE} p-1 text-sm font-semibold select-none bg-white {PRESSED_ANIM} text-slate-900"
        >
          Done
        </button>

        <button
          onclick={() => {
            if(confirm("Are you sure to logout?")) {
              open = false;
              handleLogout();
            }
          }}
          class="{BORDER_STYLE} mt-4 p-1 text-sm font-semibold select-none {ACCENT_PALETTES.rose.bg} {ACCENT_PALETTES.rose.hover} {PRESSED_ANIM} text-white"
        >
          Logout
        </button>
      </div>

      <Dialog.Close class="absolute right-4 top-4 w-8 h-8 p-1 text-sm font-bold {PRESSED_ANIM} {BORDER_STYLE}">
        ✕
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>