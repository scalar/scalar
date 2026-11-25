---
'@scalar/components': patch
---

fix(components): keep the tint of card surfaces in Chrome

Card surfaces now lighten `--scalar-background-2` in oklab rather than oklch. Current Chrome treats the hue of a near-grey color in `oklch(from …)` as missing but keeps its small chroma, so themes with tinted greys got pink code and response cards. With oklab the surface keeps the theme's own tint, and pure greys and saturated colors look the same as before.
