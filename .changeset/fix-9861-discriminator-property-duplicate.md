---
'@scalar/api-reference': patch
---

Stop rendering a discriminator base property twice. When a property's schema is a bare `discriminator.mapping` base (an object with `properties` and a `discriminator` but no explicit `oneOf`/`anyOf`), the inferred variant selector already shows those properties inside each variant (the variants `allOf` back to the base). The base object block is no longer rendered alongside the selector, so properties like the discriminator field are shown once instead of twice.
