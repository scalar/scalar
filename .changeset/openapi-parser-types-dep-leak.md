---
'@scalar/openapi-parser': patch
'@scalar/types': patch
---

Fix `@scalar/types` leaking into the published type declarations. `@scalar/openapi-parser` referenced `@scalar/types` from its `.d.ts` files while only depending on it as a `devDependency`, so consumers hit `TS2307` (cannot find module). `@scalar/types` is now a regular dependency, and the package uses the shared `UnknownObject` and `AnyObject` utility types from `@scalar/types/utils` directly instead of defining its own local copies (`AnyObject` was added to `@scalar/types/utils` alongside the existing `UnknownObject`).

The generic `AnyObject` and `UnknownObject` types are no longer re-exported from `@scalar/openapi-parser`. Import them from `@scalar/types/utils` instead.
