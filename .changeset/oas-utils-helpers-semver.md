---
'@scalar/helpers': patch
'@scalar/oas-utils': patch
---

feat(helpers): add `isVersionLessThan` next to `compareVersions` in `@scalar/helpers/general/compare-versions`.

refactor(oas-utils): drop local `migrations/semver` and use `isVersionLessThan` from `@scalar/helpers` in the workspace migrator. The previous `semverLessThan` export is removed from `@scalar/oas-utils/migrations`; import from `@scalar/helpers/general/compare-versions` instead.
