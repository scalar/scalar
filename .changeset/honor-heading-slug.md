---
'@scalar/workspace-store': minor
'@scalar/api-reference': minor
---

Make sidebar navigation honor `generateHeadingSlug`, consistent with the other `generate*Slug` options. The custom value is now prefixed with `description/` (like `model/`, `tag/`, etc. are for the other generators), so clicking a description heading navigates to the custom slug instead of the plain anchor.

Note: `generateHeadingSlug` should now return a bare slug segment (e.g. `heading.slug`) rather than a full hash like `#description/...`.
