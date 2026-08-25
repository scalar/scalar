---
'@scalar/types': patch
'@scalar/api-reference': patch
---

Migrate the `nanoid` and `security-scheme` entity schemas from `zod` to the zero-dependency `@scalar/validation`. These were the only two runtime modules in `@scalar/types` that constructed zod schema values at module load, so this removes the `zod@4.3.5` runtime path from the `@scalar/api-reference` standalone browser bundle (22 modules, ~141 KB raw). The standalone bundle drops from 3,806,019 to 3,735,844 bytes raw (1,092,517 to 1,074,157 bytes gzip). The exported schema value names and inferred types are preserved, so downstream `import type` consumers keep working unchanged. `zod` remains a dependency of `@scalar/types` because the type-only api-reference configuration schemas still use it (they are already tree-shaken out of the bundle).
