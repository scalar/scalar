---
'@scalar/workspace-store': patch
'@scalar/mock-server': patch
---

fix: keep the required properties of an object that the example depth cap truncates, so a deeply nested mock response no longer serves `{}` where its schema requires keys, including keys required through `allOf` members or the selected `oneOf`/`anyOf` variant

Preserve explicit values equal to the depth marker and exclude requirements from unselected union branches.

Keep required primitive compositions on the normal traversal and collect discriminator requirements from the branch rendered after depth truncation.

Reuse evaluated discriminator values for required-property collection and keep inferred tuple arrays empty past the depth cap.
