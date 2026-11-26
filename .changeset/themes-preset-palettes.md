---
'@scalar/themes': minor
'scalar-app': patch
---

feat(themes): refresh the palettes of nine presets and remove their hero flares

`alternate`, `moon`, `purple`, `solarized`, `bluePlanet`, `saturn`, `kepler`, `mars` and `deepSpace` get new light and dark palettes. A palette is a surface, an ink and an accent; the other tones are ink blended into the surface, so the sidebar sits one step under the page, cards one step above it, and links carry the accent. Body text, secondary text, the accent and every method hue reach 4.5:1 on the page, card and sidebar surfaces.

The decorative hero flares are gone from these nine presets, along with their gradient headings and scroll-driven header backgrounds. The other presets keep theirs. The `.section-flare` elements are still rendered, so custom CSS that styles them keeps working.
