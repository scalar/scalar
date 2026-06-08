---
'@scalar/nuxt': patch
---

fix(nuxt): render the docs page under pnpm's strict node_modules layout

Several CommonJS dependencies (`cookie`, `extend`, `debug`) were served raw by Vite under pnpm without `shamefully-hoist`, breaking the docs page with `exports is not defined` and missing-export errors. They are now wrapped into proper ESM (with named exports) regardless of which package imports them, and `@vercel/oidc` (pulled in by the AI assistant) is pre-bundled when it is hoisted into the project.
