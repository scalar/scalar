---
'@scalar/api-reference': patch
---

Render model names as plain text when there is no models section to link to. The names next to types and on the request body heading used to be links even when the whole models section was hidden via `hideModels`, or when the referenced model itself was hidden via `x-internal` / `x-scalar-ignore`. There was nothing to scroll to, so clicking them did nothing. They now render as plain text in both cases.
