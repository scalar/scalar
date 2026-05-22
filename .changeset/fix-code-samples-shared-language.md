---
'@scalar/api-client': patch
---

Fixed `x-codeSamples` entries that share a `lang`: multiple code samples with the same language but different labels (e.g. separate sync and async examples) were all marked selected and showed the same snippet. Each sample is now keyed by its position, so every one stays individually selectable.
