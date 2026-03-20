---
'@scalar/api-client': patch
'@scalar/workspace-store': patch
---

fix allowReserved query parameter support so reserved characters like colons stay unescaped and parameter typings include allowReserved
