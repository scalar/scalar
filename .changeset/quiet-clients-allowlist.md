---
'@scalar/api-reference': minor
'@scalar/api-client': patch
'@scalar/types': minor
'@scalar/schemas': minor
'@scalar/blocks': patch
'@scalar/java-integration': minor
'@scalar/aspnetcore': minor
'@scalar/aspire': minor
'@scalar/aws-lambda': minor
'@scalar/azure-functions': minor
'scalar-fastapi': minor
'scalar-ninja': minor
---

Configure available API Reference HTTP clients with `httpClients`. Use exact client IDs or target wildcards such as `shell/*`. The `defaultHttpClient` option also accepts a client ID string.

When all available clients are under **More**, such as with `featuredClients: []`, the Client Libraries block omits the empty tab list.
