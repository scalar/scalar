---
'@scalar/api-reference': patch
'@scalar/api-client': patch
---

Add an ESM standalone build (`dist/browser/standalone.esm.js`) alongside the existing UMD bundle. The new bundle works as a side-effect script (registers `window.Scalar.createApiReference` and reads `data-*` configuration) and exports `createApiReference` for direct ESM consumers. It is fully minified through Rolldown's native minifier and uses code splitting so heavy features load asynchronously after first paint:

- The API client modal (request editor, response viewer, CodeMirror) is now `await import`'d inside `onMounted` instead of statically imported, moving ~265 KB into a `chunks/modal-*.js` chunk that loads in the background.
- The Agent Scalar chat interface (already wrapped in `defineAsyncComponent`) becomes a real `chunks/AgentScalarChatInterface-*.js` chunk (~200 KB), loaded only when the agent is enabled.
- The 84 per-icon dynamic imports from `@scalar/icons/library` are coalesced into a single `chunks/icons-*.js`.

Net effect: initial sync load drops from ~3.32 MB (UMD) to ~2.73 MB (ESM) — a ~570 KB improvement — while total bundle size shrinks by ~140 KB.

Also declares `sideEffects` in both packages' `package.json` so downstream bundlers can tree-shake unused exports, and adds an `@scalar/api-client/modal/map-hidden-clients-config` deep export so consumers that only need the lightweight client-list helper don't pull the full modal barrel into their static graph.
