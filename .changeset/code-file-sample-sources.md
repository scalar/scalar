---
'@scalar/workspace-store': minor
'@scalar/json-magic': minor
'@scalar/schemas': minor
'@scalar/types': minor
'@scalar/blocks': patch
---

Load object-valued `x-codeSamples.source` and `x-code-samples.source` file references as raw code text, with relative origins and lazy operation loading. Retain failed references and show an unavailable sample instead of silently replacing them with an empty string. Preserve literal `$ref` values in other extensions and example data.
