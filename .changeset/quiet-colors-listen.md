---
'@scalar/api-reference': patch
'@scalar/themes': patch
---

fix: raise text and focus ring contrast flagged by an accessibility audit

The default light blue is a touch deeper so code strings and read-only labels meet 4.5:1, the required label darkens in light mode, keyboard focus rings now draw from a new `--scalar-focus-color` token that meets 3:1 against hovered and selected surfaces, and the schema union pipe, Default, Example and Pattern labels use the regular muted text colour.
