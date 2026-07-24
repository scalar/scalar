---
'@scalar/api-reference': patch
---

fix: badge base styles no longer rely on zero specificity

The badge base rule was written with `:where(.badge)`, which the scoped-style compiler collapsed to zero specificity, letting any late-loading reset clobber the badge font size, padding, and colors. The base styles now carry real specificity, and consumers that intentionally override them (the download-link json/yaml badges and the webhook badge) keep winning through tailwind-merge and higher-specificity variant rules.
