---
'@scalar/api-client': patch
---

test(api-client): add regression coverage for oauth2 clientCredentials security body

Adds a regression test that exercises the full oauth2 merge + authorize path for
`clientCredentials` and verifies `x-scalar-security-body` fields (for example
`audience`) are preserved and sent in the token request body.
