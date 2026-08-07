---
"@scalar/fastify-api-reference": patch
---

Fix the published type declarations so they resolve under `moduleResolution: node16`/`nodenext` again. Since `1.62.1` the `.d.ts` files re-exported relative modules without a file extension (`export { default } from './fastifyApiReference'`), which ESM resolution rejects with TS2834 — so the plugin's types silently degraded to `any` for those consumers. The declarations are now emitted as a single self-contained `index.d.ts` (matching the Next.js integration), which resolves under every module resolution setting.
