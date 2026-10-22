# API Reference playground

Run `pnpm dev --port 5173 --strictPort` from `packages/api-reference`.

- `/`: multi-source API Reference, including classic layout and external API descriptions.
- `/embedded.html`: documentation inside a scrollable application panel, with a custom Vue footer slot.
- `/path-routing`: path-based navigation; nested URLs can be reloaded directly.
- `/layout-theme.html?layout=classic&theme=purple&darkMode=true`: layout/theme preview. Layout defaults to modern, theme to default, and color mode to light. `darkMode=false` explicitly selects light mode.
- `/header.html`: a custom sticky header.

These pages are included in the deployed PR playground. Visual coverage for the migrated pages lives in `test/snapshots/playground.e2e.ts` and runs against the default Vite playground with a local Galaxy API description.
