---
'@scalar/mock-server': patch
---

Ignore declared Content-Length, Content-Encoding, and Content-Type response headers so generated bodies remain readable and empty responses do not inherit a declared content type.

Ignore other transport-managed headers, including Transfer-Encoding and Trailer. Skip and warn about malformed declared header names and values instead of failing the response.
