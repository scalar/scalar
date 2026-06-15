---
'@scalar/mock-server': patch
---

fix: improve default response selection when mocking operations with multiple response codes. The mock server now prefers `default`, then the lowest 2xx success, then the lowest non-informational code, only falling back to a 1xx response when nothing else is defined. Status code range patterns like `2XX` are supported too.
