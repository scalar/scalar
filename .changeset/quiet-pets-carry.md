---
'@scalar/openapi-upgrader': patch
---

Fix shared Swagger 2.0 body and form-data parameters being left in parameter arrays instead of request bodies. Preserve operation media types, combine form fields, and inherit path-level bodies regardless of property order.
