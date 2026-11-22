---
"@scalar/mock-server": patch
---

Validate request parameters that use `content` instead of `schema`. JSON media types are parsed before validation, so `?filter={"price":"cheap"}` is rejected when `price` is an integer.
