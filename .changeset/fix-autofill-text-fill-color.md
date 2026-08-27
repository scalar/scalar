---
'@scalar/themes': patch
---

Fix autofilled input text rendering hollow and near-illegible in dark mode. The reset clipped WebKit's autofill background to the glyphs without re-asserting `-webkit-text-fill-color`, so the glyph interiors showed that clipped background instead of the theme colour.
