---
'@scalar/json-magic': patch
---

fix: strip a leading UTF-8 BOM before JSON.parse in normalize so BOM-prefixed files parse correctly
