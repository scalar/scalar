---
'@scalar/api-reference': patch
---

Stop listing enum values twice for an array parameter whose `items` is a `$ref`
to an enum schema. The values are now listed only in the array items card, which
also shows the item schema's title and description.
