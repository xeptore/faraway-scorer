<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte'

  let { onBeforeUpdate }: { onBeforeUpdate: () => void } = $props()
  let offlineReady = $state(false)
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    immediate: true,
    onOfflineReady() {
      offlineReady = true
      window.setTimeout(() => (offlineReady = false), 5000)
    }
  })

  function applyUpdate(): void {
    onBeforeUpdate()
    void updateServiceWorker(true)
  }
</script>

{#if $needRefresh}
  <aside class="update-toast" aria-live="polite">
    <div><strong>Update available</strong><span>A fresh version is ready.</span></div>
    <button type="button" onclick={applyUpdate}>Update</button>
  </aside>
{:else if offlineReady}
  <aside class="update-toast" role="status">
    <div><strong>Ready offline</strong><span>This scorekeeper will work without a connection.</span></div>
  </aside>
{/if}
