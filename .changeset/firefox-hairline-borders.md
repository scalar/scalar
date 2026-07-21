---
'@scalar/themes': patch
---

fix: render hairline borders in Firefox on standard-DPI screens

Firefox rounds the 0.5px `--scalar-border-width` down to zero device pixels on non-retina displays, which makes `shadow-border` outlines invisible. The border width now falls back to 1px in Firefox below retina density, matching what other engines effectively render.
