---
'@scalar/client-side-rendering': patch
---

Export `DEFAULT_CDN` so consumers (e.g. `@scalar/astro`) can share the canonical fallback URL instead of duplicating it. Also widens `getConfiguration` to accept `Partial<HtmlRenderingConfiguration>`, removing the need for a `Record<string, unknown>` cast at the boundary.
