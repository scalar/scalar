---
'@scalar/api-reference': patch
'@scalar/api-client': patch
'@scalar/release-notes': patch
'@scalar/types': patch
---

Bump the `zod` catalog to `^4.4.3` so the standalone bundle ships a single `zod` instead of two (`4.3.5` from `@scalar/types` plus `4.4.3` from the `ai` / `@ai-sdk` peer). This makes `standalone.js` ~68KB raw / ~18KB gzip smaller.
