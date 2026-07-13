---
'@scalar/themes': patch
---

Fix borders invisible in Firefox on standard-density displays. Firefox rounds sub-pixel `box-shadow` spread values down to `0px` on 1x displays, which makes the inset box-shadow borders used by `shadow-border` disappear. Add a Firefox-only `@supports (-moz-appearance: none)` override, scoped to 1x displays with `@media (max-resolution: 1dppx)`, that sets `--scalar-border-width` to `1px`. Hi-DPI/retina displays keep the crisp `0.5px` hairline. Also replace hardcoded `0.5px` values in `--scalar-shadow-2` with `var(--scalar-border-width)` so shadows and borders respect the same variable.
