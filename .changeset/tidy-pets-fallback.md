---
'@scalar/workspace-store': patch
---

Honor OpenAPI discriminator `defaultMapping` when generating oneOf and anyOf examples with an absent or unmapped discriminating property. Preserve explicit variant selections and prefer explicit and implicit mappings before the fallback.
