---
'@scalar/api-client': patch
'@scalar/api-reference': patch
'@scalar/blocks': patch
'@scalar/helpers': patch
'@scalar/workspace-store': patch
'scalar-app': patch
---

Resolve empty OpenAPI server variable defaults in request URLs and code snippets, including variables with Unicode names. Preserve empty path segments and append the operation path even when it matches the resolved server path. Preserve placeholders for undeclared server variables. Resolve relative server templates, including dotted path segments, against the API description. Retain the description base through environment substitution and when generating snippets for server overrides. Preserve the host in network-path server references and keep restored server selections when a workspace is reloaded. Honor saved path-level server selections in requests and snippets, and let operations that inherit path servers edit them in the Servers screen.
