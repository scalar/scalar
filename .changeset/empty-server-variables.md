---
'@scalar/blocks': patch
'@scalar/helpers': patch
'@scalar/workspace-store': patch
---

Resolve empty OpenAPI server variable defaults in request URLs and code snippets, including variables with Unicode names. Preserve empty path segments and append the operation path even when it matches the resolved server path. Preserve placeholders for undeclared server variables.
