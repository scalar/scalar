---
'@scalar/themes': patch
---

Fix borders invisible in Firefox: add `@supports (-moz-appearance: none)` override to set `--scalar-border-width` to `1px` in Firefox, which rounds sub-pixel box-shadow spread values to `0px` on 1× displays. Also replace hardcoded `0.5px` values in `--scalar-shadow-2` with `var(--scalar-border-width)` so both shadows and borders respect the same variable.
