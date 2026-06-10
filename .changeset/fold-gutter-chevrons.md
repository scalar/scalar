---
'@scalar/use-codemirror': patch
---

Render the code fold gutter chevron icons. The marker SVGs had a `viewBox` but no width/height, so they collapsed to zero size and were invisible. Folding worked but had no visual affordance. They now size to `1em` and render correctly in both light and dark mode.
