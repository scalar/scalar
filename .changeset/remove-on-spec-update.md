---
'@scalar/types': patch
'@scalar/schemas': patch
'@scalar/nuxt': patch
---

Remove the unused `onSpecUpdate` configuration option. It was never wired to a consumer, so the callback never fired.
