---
'@scalar/api-client': patch
---

fix: only offer the security schemes an operation actually declares

The auth dropdown no longer lists every scheme from `components.securitySchemes`. In the reference docs and the request modal it now respects the operation's `security`: an operation with `security: []` offers no auth, and an operation that lists a subset of schemes only offers those. The standalone client keeps letting you attach any defined scheme.
