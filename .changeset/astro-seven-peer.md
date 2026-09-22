---
'@scalar/astro': patch
---

Accept Astro 7 as a peer dependency. Astro 7 escapes attribute quotes as `&quot;`, so the render test now normalizes the entity before asserting.
