---
"@scalar/fastify-api-reference": patch
---

Emit resolvable declaration files for consumers on `moduleResolution: node16`/`nodenext`. Since `1.62.1` the published `.d.ts` files re-exported relative modules without a file extension (`export { default } from './fastifyApiReference'`), which ESM resolution rejects with TS2834 — so the plugin's types silently degraded to `any` for those consumers, and `skipLibCheck: true` hid the cause. The relative specifiers in source now carry explicit `.js` extensions, so the emit is correct regardless of how the bundle is produced.
