---
'@scalar/use-codemirror': patch
---

Render the code fold gutter chevron icons. The marker SVGs had a `viewBox` but no width/height, so they collapsed to zero size and were invisible. Folding worked but had no visual affordance. The chevrons now render at a fixed size, sit centered in the fold gutter, and use a muted color that brightens on hover — in both light and dark mode.
