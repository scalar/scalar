---
'@scalar/openapi-parser': patch
---

fix: strip a leading UTF-8 BOM before JSON.parse in normalize so BOM-prefixed JSON documents parse correctly
