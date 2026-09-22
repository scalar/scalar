---
'@scalar/api-reference': patch
'@scalar/workspace-store': patch
---

Create the API reference's document store in one place and have the reference depend only on the slice of the store it uses, so another store implementation can back the reference later. `getActiveEnvironment` now accepts any object with a `workspace`, not only a full workspace store.
