---
'@scalar/api-reference': patch
---

fix(api-reference): stop `lh`-in-`calc()` PostCSS warnings during consumer builds

The enum property decorator used `calc(0.5lh)` and `calc(0.5lh + 4px)`. Older `postcss-calc` versions (pulled in transitively by consumer builds via cssnano) cannot parse the `lh` unit inside `calc()` and emitted parse warnings. The redundant `calc()` is dropped, and the half-line value is kept in a custom property so the reducer skips it. The rendered output is unchanged.
