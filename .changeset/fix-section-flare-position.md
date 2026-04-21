---
'@scalar/api-reference': patch
---

fix: restore `position: fixed` on `.section-flare` so the decorative hero flare stops reserving 100vh of empty space at the top of the documentation (affects the `kepler`, `bluePlanet`, and `mars` themes, which declare `height: 100vh` on the flare but rely on the framework to position it)
