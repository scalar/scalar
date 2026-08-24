---
'@scalar/api-reference': patch
---

Fix oneOf selector labels showing the shared allOf base name instead of the variant's own name. When a oneOf branch extended a common base through a single-`$ref` allOf (a common inheritance pattern), flattening that allOf for display left the base schema's own `$ref` on the flattened variant, so the selector picked up the base's name for every branch instead of each branch's own name.
