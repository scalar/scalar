---
'@scalar/helpers': minor
---

Add `createSharedLoader` to `@scalar/helpers/general/create-shared-loader`, which loads each key once for every caller, caches the result and forgets failures so the next call tries again
