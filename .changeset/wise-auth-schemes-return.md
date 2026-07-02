---
'@scalar/api-client': patch
---

Let the embedded API client (the "Test Request" modal) attach any defined security scheme, like the standalone client already does. Since #9592 the modal respected the operation's declared `security`, so operations that opt out with `security: []` (or a subset) offered no way to set a token while testing. The reference docs auth block still respects the declared security.
