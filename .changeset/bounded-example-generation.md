---
'@scalar/workspace-store': patch
'@scalar/api-reference': patch
'@scalar/blocks': patch
---

Fix the API reference freezing on schemas with several recursive or cross-referencing `$ref`s. Generated examples that are too large to render at full depth are now rendered at the deepest depth that fits.
