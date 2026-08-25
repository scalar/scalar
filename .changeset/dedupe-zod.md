---
'@scalar/api-reference': patch
---

Ship a single version of `zod` in the standalone bundle by pinning it via a pnpm override, removing a duplicate copy (~68KB raw / ~18KB gzip smaller `standalone.js`).
