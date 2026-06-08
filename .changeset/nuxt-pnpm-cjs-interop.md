---
'@scalar/nuxt': patch
---

fix(nuxt): pre-bundle @vercel/oidc so the docs page renders under pnpm

Under pnpm's strict node_modules layout, `@vercel/oidc` (pulled in transitively by the AI assistant) was served as raw CommonJS and broke the docs page. It is now pre-bundled by Vite when it is hoisted into the project. The other CommonJS offenders are fixed at their source packages instead.
