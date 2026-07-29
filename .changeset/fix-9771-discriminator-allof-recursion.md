---
'@scalar/api-reference': patch
---

Stop recursive schema rendering when a discriminator variant `allOf`s back to its base type. The selected child now inherits the parent's discriminator context so the mapping is not re-inferred on every nest.
