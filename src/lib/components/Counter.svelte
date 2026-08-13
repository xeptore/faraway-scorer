<script lang="ts">
  let {
    label,
    value,
    onchange
  }: { label: string; value: number; onchange: (value: number) => void } = $props()

  const update = (next: number) => onchange(Math.max(0, Math.floor(next || 0)))
</script>

<div class="counter-row">
  <label for={`counter-${label.replaceAll(' ', '-').toLowerCase()}`}>{label}</label>
  <div class="counter-control">
    <button type="button" aria-label={`Decrease ${label}`} onclick={() => update(value - 1)} disabled={value <= 0}>−</button>
    <input
      id={`counter-${label.replaceAll(' ', '-').toLowerCase()}`}
      type="number"
      min="0"
      inputmode="numeric"
      value={value}
      aria-label={label}
      oninput={(event) => update(Number(event.currentTarget.value))}
    />
    <button type="button" aria-label={`Increase ${label}`} onclick={() => update(value + 1)}>+</button>
  </div>
</div>
