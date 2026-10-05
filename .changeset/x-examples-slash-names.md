---
"@scalar/openapi-upgrader": patch
---

Keep Swagger 2.0 named examples whose name contains a slash, such as `Coupons/Promos`. Only registered media types are treated as media-type keys, so one such name no longer drops every request body example.
