---
'@scalar/nuxt': patch
---

fix: remove unnecessary optimizeDeps configuration

Vite's automatic dependency discovery now handles CommonJS dependencies correctly without needing explicit optimizeDeps.include configuration. The previous configuration was causing warnings and is no longer necessary.
