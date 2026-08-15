# Faraway Scorekeeper

An offline-first Progressive Web App for calculating final Faraway scores.

## Features

- Score Sanctuaries and Regions in reverse exploration order.
- Validate card numbers, journey gaps, and duplicates across players.
- Autosave locally and install with user-controlled PWA updates.

## Development

```sh
pnpm install
pnpm run dev
pnpm run check
pnpm run test:coverage
pnpm run format:check
pnpm run icons:check
pnpm run build
```

Set `VITE_BASE` when validating a subpath deployment, for example
`VITE_BASE=/faraway-scorer/ pnpm run build`.

## Architecture

- `src/lib/domain`: pure game types, validation, ranking, and scoring rules.
- `src/lib/components`: reusable Svelte UI components.
- `src/lib/persistence.ts`: versioned, validated device-local storage.
- `src/lib/pwa.ts`: service-worker lifecycle registration.
- `src/App.svelte`: application orchestration and screen composition.

## Deployment

Pushes to `main` run formatting, icon, type, coverage, and production-build checks before
publishing to GitHub Pages.

## License

MIT. Faraway is a trademark of Catch Up Games. This is an unofficial, non-affiliated fan
project.
