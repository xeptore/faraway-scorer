<script lang="ts">
  import Counter from './lib/components/Counter.svelte'
  import RegionDetails from './lib/components/RegionDetails.svelte'
  import UpdatePrompt from './lib/components/UpdatePrompt.svelte'
  import { BIOMES, createRegionLookup, RESOURCES } from './lib/domain/cards'
  import { BIOME_LABELS, RESOURCE_LABELS } from './lib/domain/format'
  import {
    createGame,
    MAX_PLAYERS,
    MIN_PLAYERS,
    REGION_POSITIONS,
    type Game,
    type Player,
    type RegionSequence
  } from './lib/domain/game'
  import { rankPlayers } from './lib/domain/ranking'
  import { scoreRegionSequence, type RegionScoreResult, type SequenceScore } from './lib/domain/scoring'
  import { parseRegionInput, regionFieldKey, validateGameRegions } from './lib/domain/validation'
  import { REGION_CARDS } from './lib/data/regions'
  import { clearGame, loadGame, saveGame } from './lib/persistence'
  import { tick } from 'svelte'

  const cardLookup = createRegionLookup(REGION_CARDS)
  const restoredGame = loadGame()

  interface SetupPlayer {
    id: string
    name: string
    placeholder: string
  }

  const playerNamePlaceholders = ['Ada', 'Alex', 'Casey', 'Charlie', 'Jordan', 'Morgan', 'Sam']

  function createSetupPlayer(placeholder: string): SetupPlayer {
    return { id: crypto.randomUUID(), name: '', placeholder }
  }

  function initialSetupPlayers(): SetupPlayer[] {
    return [createSetupPlayer(playerNamePlaceholders[0]), createSetupPlayer(playerNamePlaceholders[1])]
  }

  function nextPlaceholder(players: readonly SetupPlayer[]): string {
    const used = new Set(players.map((player) => player.placeholder))
    return playerNamePlaceholders.find((placeholder) => !used.has(placeholder)) ?? playerNamePlaceholders[0]
  }

  let game: Game | null = $state(restoredGame)
  let view: 'resume' | 'setup' | 'game' = $state(restoredGame ? 'resume' : 'setup')
  let setupPlayers: SetupPlayer[] = $state(initialSetupPlayers())
  let trayExpanded = $state(false)
  let showNewGameConfirm = $state(false)
  let regionDrafts: Record<string, string> = $state({})
  let rawErrors: Record<string, string> = $state({})
  let selectedDetail: { result: RegionScoreResult; position: number } | null = $state(null)
  let standingsCloseButton = $state<HTMLButtonElement>()
  let confirmCancelButton = $state<HTMLButtonElement>()

  const validationErrors = $derived(game ? validateGameRegions(game, cardLookup) : new Map())
  const scores = $derived.by(() => {
    const scoreMap = new Map<string, SequenceScore>()
    if (!game) return scoreMap
    for (const player of game.players) {
      const sequence = player.regions.map((id, position) =>
        validationErrors.has(regionFieldKey(player.id, position)) || rawErrors[regionFieldKey(player.id, position)]
          ? null
          : id
      ) as RegionSequence
      scoreMap.set(player.id, scoreRegionSequence(player.sanctuary, sequence, cardLookup))
    }
    return scoreMap
  })
  const fameByPlayer = $derived(
    new Map(game?.players.map((player) => [player.id, scores.get(player.id)?.totalFame ?? 0]) ?? [])
  )
  const standings = $derived(game ? rankPlayers(game.players, fameByPlayer) : [])
  const allComplete = $derived(game?.players.every((player) => scores.get(player.id)?.complete) ?? false)
  const activePlayer = $derived(game?.players.find((player) => player.id === game?.activePlayerId) ?? game?.players[0] ?? null)
  const activeScore = $derived(activePlayer ? scores.get(activePlayer.id) ?? null : null)

  $effect(() => {
    if (game) saveGame(game)
  })

  $effect(() => {
    if (trayExpanded) void tick().then(() => standingsCloseButton?.focus())
  })

  $effect(() => {
    if (showNewGameConfirm) void tick().then(() => confirmCancelButton?.focus())
  })

  function startGame(): void {
    const names = setupPlayers.map((player) => player.name.trim())
    if (names.some((name) => !name)) return
    game = createGame(names)
    regionDrafts = {}
    rawErrors = {}
    view = 'game'
  }

  function addPlayer(): void {
    if (setupPlayers.length < MAX_PLAYERS) {
      setupPlayers.push(createSetupPlayer(nextPlaceholder(setupPlayers)))
    }
  }

  function removePlayer(id: string): void {
    if (setupPlayers.length > MIN_PLAYERS) {
      setupPlayers = setupPlayers.filter((player) => player.id !== id)
    }
  }

  function requestNewGame(): void {
    if (game) showNewGameConfirm = true
    else resetToSetup()
  }

  function resetToSetup(): void {
    clearGame()
    game = null
    setupPlayers = initialSetupPlayers()
    regionDrafts = {}
    rawErrors = {}
    showNewGameConfirm = false
    trayExpanded = false
    view = 'setup'
  }

  function selectPlayer(playerId: string): void {
    if (!game) return
    game.activePlayerId = playerId
    game.screen = 'scoring'
    trayExpanded = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function setRegion(player: Player, position: number, value: string): void {
    const key = regionFieldKey(player.id, position)
    regionDrafts[key] = value
    const parsed = parseRegionInput(value)
    if (parsed === 'notNumeric') {
      rawErrors[key] = 'Enter numbers only.'
      return
    }
    delete rawErrors[key]
    player.regions[position] = parsed
  }

  function focusNext(position: number): void {
    if (position >= 7 || !activePlayer) return
    document.getElementById(`region-${activePlayer.id}-${position + 1}`)?.focus()
  }

  function setNonNegative(update: () => void): void {
    update()
  }

  function showResults(): void {
    if (!game || !allComplete) return
    game.screen = 'results'
    trayExpanded = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
</script>

<svelte:head>
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</svelte:head>

<svelte:window onkeydown={(event) => {
  if (event.key !== 'Escape') return
  showNewGameConfirm = false
  trayExpanded = false
}} />

{#if view === 'resume' && game}
  <main class="start-shell">
    <section class="start-card">
      <div class="brand-mark"><span></span></div>
      <p class="eyebrow">Faraway scorekeeper</p>
      <h1>Your return journey is waiting.</h1>
      <p class="intro">Continue where you left off, with every Region and Sanctuary saved on this device.</p>
      <div class="resume-summary">
        {#each game.players as player}
          <div><span>{player.name}</span><strong>{scoreRegionSequence(player.sanctuary, player.regions, cardLookup).enteredCount}/8</strong></div>
        {/each}
      </div>
      <button class="primary-button" type="button" onclick={() => (view = 'game')}>Continue game</button>
      <button class="text-button" type="button" onclick={requestNewGame}>Start a new game</button>
    </section>
  </main>
{:else if view === 'setup'}
  <main class="start-shell">
    <section class="start-card setup-card">
      <div class="brand-mark"><span></span></div>
      <p class="eyebrow">New game</p>
      <h1>Who made the journey?</h1>
      <p class="intro">Add 2–7 explorers. You can switch between them freely while scoring.</p>
      <div class="name-list">
        {#each setupPlayers as player, index (player.id)}
          <label>
            <span>Player {index + 1}</span>
            <div class="name-input-wrap">
              <input
                type="text"
                maxlength="24"
                placeholder={`e.g. ${player.placeholder}`}
                bind:value={player.name}
                autocomplete="off"
              />
              {#if setupPlayers.length > MIN_PLAYERS}
                <button type="button" aria-label={`Remove player ${index + 1}`} onclick={() => removePlayer(player.id)}>×</button>
              {/if}
            </div>
          </label>
        {/each}
      </div>
      {#if setupPlayers.length < MAX_PLAYERS}
        <button class="add-button" type="button" onclick={addPlayer}><span>+</span> Add player</button>
      {/if}
      <button class="primary-button" type="button" onclick={startGame} disabled={setupPlayers.some((player) => !player.name.trim())}>Start scoring <span>→</span></button>
      <p class="local-note">Stored only on this device · Works offline</p>
    </section>
  </main>
{:else if game && game.screen === 'results'}
  <main class="results-shell">
    <header class="app-header simple-header">
      <div class="mini-brand"><span></span>Faraway</div>
      <button class="header-action" type="button" onclick={requestNewGame}>New game</button>
    </header>
    <section class="results-card">
      <p class="eyebrow">Journey complete</p>
      <h1>Final scores</h1>
      <div class="podium-list">
        {#each standings as entry}
          <button type="button" onclick={() => selectPlayer(entry.player.id)}>
            <span class:medal={entry.rank <= 3} class="rank">{entry.rank}</span>
            <span class="result-name">{entry.player.name}{entry.tied ? ' · tied' : ''}</span>
            <strong>{entry.fame}</strong>
          </button>
        {/each}
      </div>
      <p class="tie-note">Ties use the lowest total Exploration Duration. Exact ties stay tied.</p>
      <button class="primary-button" type="button" onclick={() => (game!.screen = 'scoring')}>Edit scores</button>
      <button class="text-button" type="button" onclick={requestNewGame}>Start a new game</button>
    </section>
  </main>
{:else if game && activePlayer && activeScore}
  <div class="score-app">
    <header class="app-header">
      <div class="mini-brand"><span></span>Faraway</div>
      <div class="header-score"><span>{activeScore.complete ? 'Total fame' : 'Current fame'}</span><strong>{activeScore.totalFame}</strong></div>
      <button class="menu-button" type="button" aria-label="Start a new game" onclick={requestNewGame}>•••</button>
    </header>

    <nav class="player-tabs" aria-label="Players">
      {#each game.players as player}
        <button
          type="button"
          class:active={player.id === activePlayer.id}
          aria-current={player.id === activePlayer.id ? 'page' : undefined}
          onclick={() => selectPlayer(player.id)}
        >
          <span>{player.name}</span><small>{scores.get(player.id)?.enteredCount ?? 0}/8</small>
        </button>
      {/each}
    </nav>

    <main class="score-content">
      {#if REGION_CARDS.length === 0}
        <aside class="dataset-notice">
          <strong>Region data is ready for you.</strong>
          <span>Add the official definitions to <code>src/lib/data/regions.ts</code>; undefined numbers are safely rejected until then.</span>
        </aside>
      {/if}

      <section class="section-card sanctuary-card">
        <div class="section-heading">
          <div><p class="eyebrow">Always visible</p><h2>Sanctuaries</h2></div>
          <label class="fame-input"><span>Sanctuary fame</span><input type="number" min="0" inputmode="numeric" value={activePlayer.sanctuary.fame} oninput={(event) => (activePlayer.sanctuary.fame = Math.max(0, Math.floor(Number(event.currentTarget.value) || 0)))} /></label>
        </div>

        <details>
          <summary><span>Scoring contributions</span><small>Resources, biomes & more</small></summary>
          <div class="counter-group">
            <h3>Resources</h3>
            {#each RESOURCES as resource}
              <Counter label={RESOURCE_LABELS[resource]} value={activePlayer.sanctuary.resources[resource]} onchange={(value) => setNonNegative(() => (activePlayer.sanctuary.resources[resource] = value))} />
            {/each}
          </div>
          <div class="counter-group">
            <h3>Biomes</h3>
            {#each BIOMES as biome}
              <Counter label={BIOME_LABELS[biome]} value={activePlayer.sanctuary.biomes[biome]} onchange={(value) => setNonNegative(() => (activePlayer.sanctuary.biomes[biome] = value))} />
            {/each}
          </div>
          <div class="counter-group two-column-counters">
            <Counter label="Clues" value={activePlayer.sanctuary.clues} onchange={(value) => setNonNegative(() => (activePlayer.sanctuary.clues = value))} />
            <Counter label="Nighttime cards" value={activePlayer.sanctuary.nighttimeCards} onchange={(value) => setNonNegative(() => (activePlayer.sanctuary.nighttimeCards = value))} />
          </div>
        </details>
      </section>

      <section class="journey-section">
        <div class="journey-heading">
          <div><p class="eyebrow">Return journey</p><h2>Score in reverse</h2></div>
          <span>{activeScore.enteredCount} of 8 entered</span>
        </div>
        <p class="journey-help">Start with the last Region played. Each valid card scores immediately.</p>

        <div class="journey-list">
          {#each REGION_POSITIONS as playedPosition, position}
            {@const key = regionFieldKey(activePlayer.id, position)}
            {@const result = activeScore.results[position]}
            {@const error = rawErrors[key] ?? validationErrors.get(key)?.message}
            <div class:error-row={Boolean(error)} class:complete-row={Boolean(result)} class="region-row">
              <div class="position-marker"><strong>{playedPosition}</strong><span>{playedPosition === 1 ? 'st' : playedPosition === 2 ? 'nd' : playedPosition === 3 ? 'rd' : 'th'}</span></div>
              <label for={`region-${activePlayer.id}-${position}`}><span>Region</span></label>
              <span class="hash">#</span>
              <input
                id={`region-${activePlayer.id}-${position}`}
                class="region-input"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                enterkeyhint={position === 7 ? 'done' : 'next'}
                autocomplete="off"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `error-${activePlayer.id}-${position}` : undefined}
                value={regionDrafts[key] ?? activePlayer.regions[position] ?? ''}
                oninput={(event) => setRegion(activePlayer, position, event.currentTarget.value)}
                onkeydown={(event) => event.key === 'Enter' && focusNext(position)}
              />
              {#if result}
                <button class="row-score" type="button" aria-label={`Explain ${result.fame} Fame for Region ${result.regionId}`} onclick={() => (selectedDetail = { result, position: playedPosition })}>
                  <strong>{result.fame > 0 ? '+' : ''}{result.fame}</strong><span>›</span>
                </button>
              {:else}
                <span class="pending-score">—</span>
              {/if}
              {#if error}<p id={`error-${activePlayer.id}-${position}`} class="field-error">{error}</p>{/if}
            </div>
          {/each}
        </div>
      </section>

      <section class="score-summary" aria-live="polite">
        <div><span>Region fame</span><strong>{activeScore.regionFame}</strong></div>
        <div><span>Sanctuary fame</span><strong>{activeScore.sanctuaryFame}</strong></div>
        <div class="grand-total"><span>{activeScore.complete ? 'Total fame' : 'Current fame'}</span><strong>{activeScore.totalFame}</strong></div>
      </section>
    </main>

    <aside class="score-tray" class:expanded={trayExpanded}>
      {#if trayExpanded}
        <div class="tray-backdrop" role="presentation" onclick={() => (trayExpanded = false)}></div>
        <section class="standings-sheet" aria-labelledby="standings-title">
          <div class="sheet-handle"></div>
          <div class="sheet-header"><div><p class="eyebrow">Live table</p><h2 id="standings-title">Current standings</h2></div><button bind:this={standingsCloseButton} class="icon-button" type="button" aria-label="Close standings" onclick={() => (trayExpanded = false)}>×</button></div>
          <div class="standings-list">
            {#each standings as entry}
              <button type="button" onclick={() => selectPlayer(entry.player.id)}>
                <span class="standing-rank">{entry.rank}</span><span>{entry.player.name}</span><small>{scores.get(entry.player.id)?.enteredCount ?? 0}/8</small><strong>{entry.fame}</strong>
              </button>
            {/each}
          </div>
          <button class="primary-button" type="button" disabled={!allComplete} onclick={showResults}>View final results</button>
          {#if !allComplete}<p class="tray-note">Complete all eight Regions for every player to see final results.</p>{/if}
        </section>
      {/if}
      <div class="tray-bar">
        <button class="standings-toggle" type="button" aria-expanded={trayExpanded} onclick={() => (trayExpanded = !trayExpanded)}><span>Scores</span><small>{trayExpanded ? 'Close' : 'Standings'} <b>{trayExpanded ? '↓' : '↑'}</b></small></button>
        <div class="tray-players">
          {#each game.players as player}
            <button class:active={player.id === activePlayer.id} type="button" onclick={() => selectPlayer(player.id)}>
              <span>{player.name}</span><strong>{scores.get(player.id)?.totalFame ?? 0}</strong><small>{scores.get(player.id)?.enteredCount ?? 0}/8</small>
            </button>
          {/each}
        </div>
      </div>
    </aside>
  </div>
{/if}

{#if selectedDetail}
  <RegionDetails result={selectedDetail.result} position={selectedDetail.position} onclose={() => (selectedDetail = null)} />
{/if}

{#if showNewGameConfirm}
  <div class="modal-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && (showNewGameConfirm = false)}>
    <div class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="new-game-title" tabindex="-1">
      <div class="confirm-icon">↻</div>
      <h2 id="new-game-title">Start a new game?</h2>
      <p>This clears the current journey from this device. This cannot be undone.</p>
      <div><button bind:this={confirmCancelButton} class="secondary-button" type="button" onclick={() => (showNewGameConfirm = false)}>Keep scoring</button><button class="danger-button" type="button" onclick={resetToSetup}>Clear & start over</button></div>
    </div>
  </div>
{/if}

<UpdatePrompt onBeforeUpdate={() => game && saveGame(game)} />
