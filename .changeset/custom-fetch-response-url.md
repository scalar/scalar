---
'@scalar/api-client': patch
---

Fall back to the requested URL when a custom fetch returns a response without one. Errors raised while reading the response body are now returned as an error result instead of escaping the request helper.
