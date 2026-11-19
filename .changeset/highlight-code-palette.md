---
'@scalar/highlight': minor
'@scalar/themes': minor
'@scalar/components': patch
---

Give syntax highlighting a fuller palette

Parameters, object members, type names and punctuation now have their own colors, plain code is easier to read, and the colors are adjusted so they stay readable and distinct in light and dark mode. They still come from the active theme's hues.

The colors live in `@scalar/themes` as `--scalar-code-*` variables named by role (`--scalar-code-keyword`, `--scalar-code-string`, `--scalar-code-parameter` and so on), so a theme or custom stylesheet can set its own syntax colors. The Moon theme sets darker and lighter values to stay readable on its tinted backgrounds.
