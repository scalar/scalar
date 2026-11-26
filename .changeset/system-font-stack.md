---
"@scalar/themes": minor
"@scalar/api-reference": minor
---

Use the system font stack and stop loading web fonts. `--scalar-font` and `--scalar-font-code` now default to the platform's own UI and monospace fonts, and the Inter and JetBrains Mono files from fonts.scalar.com are no longer requested. `defaultFonts`, `@scalar/themes/fonts.css` and the `fonts` option of `getThemeStyles` are deprecated and do nothing. A custom theme that names Inter or JetBrains Mono now needs to load that font itself.
