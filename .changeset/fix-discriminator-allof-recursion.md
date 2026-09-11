---
'@scalar/api-reference': patch
---

fix: render the variant selector for discriminator-only schemas used as array items without infinite recursion

A polymorphic base that declares only a `discriminator.mapping` (no explicit `oneOf`) and whose subtypes inherit through `allOf: [$ref base, …]` now renders its "One of" variant selector consistently, whether the base is used directly as an object property or as array `items`. Previously the merged subtype re-surfaced the base's discriminator, which made it look like the base again and drove the selector inference into infinite recursion.
