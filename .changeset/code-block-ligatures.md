---
'@scalar/components': patch
'@scalar/highlight': patch
---

Let the code font form its ligatures again in code blocks.

`ScalarCodeBlock` carried `font-variant-ligatures: none`, which stopped `--scalar-font-code` (JetBrains Mono) from combining `=>`, `!==`, `>=` and `<=` into single glyphs. That is what the font is chosen for, and it is how code blocks rendered before the rule was added.

`@scalar/highlight`'s own stylesheet carried the same rule, so the two now agree rather than disagreeing depending on which theme a consumer loads.
