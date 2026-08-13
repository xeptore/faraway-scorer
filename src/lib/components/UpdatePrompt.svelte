<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte'

  let { onBeforeUpdate }: { onBeforeUpdate: () => void } = $props()
  const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true })

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
{/if}
