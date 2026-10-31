---
'@scalar/workspace-store': patch
'@scalar/mock-server': patch
---

fix: keep the required properties of an object that the example depth cap truncates, so a deeply nested mock response no longer serves `{}` where its schema requires keys
