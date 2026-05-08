---
'@scalar/workspace-store': patch
'@scalar/api-client': patch
---

fix: share executable URL build for copy and buildRequest

Copy URL from the operation address bar now matches the URL that is actually sent: path parameters, operation query string, environment substitution, and security schemes that use in: query are all applied the same way as Send.