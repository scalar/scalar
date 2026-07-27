---
'@scalar/api-reference': patch
---

fix: read enum metadata from array items

When an enum is defined inside an array schema's `items`, the enum values were resolved from `items` but their `x-enum-varnames`, `x-enumNames`, and `x-enumDescriptions` were still read from the outer schema, so the metadata was dropped. Both the values and their metadata are now read from the same schema.
