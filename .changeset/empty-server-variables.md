---
'@scalar/api-client': patch
'@scalar/api-reference': patch
'@scalar/blocks': patch
'@scalar/helpers': patch
'@scalar/workspace-store': patch
---

Resolve empty OpenAPI server variable defaults in request URLs and code snippets, including variables with Unicode names. Preserve empty path segments and append the operation path even when it matches the resolved server path. Preserve placeholders for undeclared server variables. Resolve relative server templates against the API description and keep authored empty path segments when attaching the origin. Retain the description base through environment substitution and when generating snippets for server overrides. Preserve the host in network-path server references and restore unambiguous saved selections.
