---
'@scalar/blocks': patch
---

fix: stop vendoring a second copy of the themes reset in the standalone stylesheet

The blocks `style.css` build pulled in `@scalar/components/style.css`, which re-imports `@scalar/themes/style.css` — so the published stylesheet shipped two unlayered copies of the universal reset. Loaded after the other Scalar packages, the late duplicate clobbered component font sizes, padding, and colors. Blocks now composes the lean `@scalar/components/vue-styles.css` instead, matching how `@scalar/api-reference` and `@scalar/components` build their stylesheets, and exposes `./vue-styles.css` alongside `./style.css` and `./tailwind.config.css`.
