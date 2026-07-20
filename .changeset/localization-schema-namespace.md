---
'@scalar/api-reference': minor
'@scalar/types': minor
---

feat: move schema-vocabulary translation keys from `common.*` into `schema.*` and drive localization through the new shared `@scalar/localization` engine.

If you customize `localization.translations`, schema-related keys have moved namespace — for example `common.nullable` is now `schema.nullable` and `common.required` is now `schema.required`. Only `description`, `httpMethod`, and `path` remain under `common`.
