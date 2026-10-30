---
'@scalar/mock-server': patch
---

fix: match concrete paths before templated ones, so `/pets/mine` is answered by its own operation even when the document declares `/pets/{petId}` first
