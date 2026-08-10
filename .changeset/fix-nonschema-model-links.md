---
'@scalar/api-reference': patch
---

Only render a clickable model name link when the `$ref` actually targets `#/components/schemas/`. Refs into other component buckets (parameters, responses, ...) or external files now show the name as plain text instead of a dead link that scrolls nowhere.
