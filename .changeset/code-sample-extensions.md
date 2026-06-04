---
'@scalar/workspace-store': minor
'@scalar/api-client': minor
'@scalar/api-reference': patch
'@scalar/schemas': minor
'@scalar/types': minor
---

feat: read code samples from x-readme, x-stainless and x-scalar extensions

In addition to `x-codeSamples`, the code sample picker now reads custom samples from `x-scalar-examples`, `x-stainless-snippets`, `x-stainless-examples`, and `x-readme.code-samples`. When more than one is present on an operation, the highest-priority source is used (x-scalar-examples > x-stainless-snippets > x-stainless-examples > x-readme > x-codeSamples).
