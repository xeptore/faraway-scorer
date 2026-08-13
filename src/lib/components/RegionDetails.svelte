<script lang="ts">
  import { RESOURCE_LABELS, pluralize, targetLabel } from '../domain/format'
  import type { RegionScoreResult } from '../domain/scoring'
  import { tick } from 'svelte'

  let { result, position, onclose }: { result: RegionScoreResult; position: number; onclose: () => void } = $props()
  let closeButton: HTMLButtonElement

  $effect(() => {
    void tick().then(() => closeButton?.focus())
  })
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && onclose()} />

<div class="modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && onclose()}>
  <div class="sheet detail-sheet" role="dialog" aria-modal="true" aria-labelledby="region-detail-title" tabindex="-1">
    <div class="sheet-handle"></div>
    <header class="sheet-header">
      <div>
        <p class="eyebrow">{position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : `${position}th`} played</p>
        <h2 id="region-detail-title">Region #{result.regionId}</h2>
      </div>
      <button bind:this={closeButton} class="icon-button" type="button" aria-label="Close details" onclick={onclose}>×</button>
    </header>

    <div class="detail-block">
      <div class="detail-title-row">
        <h3>Prerequisite</h3>
        <span class:success={result.prerequisite.satisfied} class:error={!result.prerequisite.satisfied}>
          {result.prerequisite.satisfied ? '✓ Satisfied' : '× Not met'}
        </span>
      </div>
      {#if result.prerequisite.type === 'none'}
        <p class="muted">This Region has no resource prerequisite.</p>
      {:else}
        <div class="detail-table" role="table" aria-label="Resource prerequisites">
          <div class="table-row table-head" role="row">
            <span role="columnheader">Resource</span><span role="columnheader">Required</span><span role="columnheader">Visible</span>
          </div>
          {#each result.prerequisite.requirements as requirement}
            <div class="table-row" role="row">
              <span role="cell">{RESOURCE_LABELS[requirement.resource]}</span>
              <span role="cell"><strong>{requirement.required}</strong></span>
              <span role="cell" class:error={!requirement.satisfied}><strong>{requirement.visible}</strong></span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="detail-block">
      <h3>Scoring</h3>
      {#if result.calculation.type === 'fixed'}
        <p class="calculation-line">Fixed reward <strong>{result.calculation.fame} Fame</strong></p>
      {:else if result.calculation.type === 'perCount'}
        <div class="detail-list">
          {#each result.calculation.matches as match}
            <div><span>{targetLabel(match.target)}</span><strong>{match.count}</strong></div>
          {/each}
        </div>
        <p class="calculation-line">
          {result.calculation.totalCount} matching {pluralize(result.calculation.totalCount, 'item')} × {result.calculation.famePerItem} Fame
        </p>
      {:else}
        <div class="detail-list">
          {#each result.calculation.members as member}
            <div><span>{targetLabel(member.target)}</span><strong>{member.count}</strong></div>
          {/each}
        </div>
        <p class="calculation-line">
          {result.calculation.setCount} complete {pluralize(result.calculation.setCount, 'set')} × {result.calculation.famePerSet} Fame
        </p>
      {/if}
    </div>

    {#if !result.prerequisite.satisfied}
      <p class="failed-note">The calculation is shown for reference, but this Region scores 0 because its prerequisite is not met.</p>
    {/if}

    <div class="detail-total"><span>Total</span><strong>{result.fame} Fame</strong></div>
  </div>
</div>
