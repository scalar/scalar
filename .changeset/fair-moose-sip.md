---
'@scalar/mock-server': patch
---

fix: improve default response selection when mocking operations with multiple response codes. The mock server now prefers the lowest 2xx success, then the lowest non-informational code, then the `default` catch-all, only falling back to a 1xx response when nothing else is defined. Status code range patterns like `2XX` are supported and treated as their lowest member, with explicit codes taking precedence over the range that covers them.
