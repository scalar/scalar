---
"@scalar/workspace-store": patch
"@scalar/api-client": patch
"@scalar/blocks": patch
"@scalar/api-reference": patch
---

Use OpenAPI 3.2 dataValue and serializedValue examples for named parameters in the editor, outgoing requests, and code samples. Preserve already serialized values without encoding them twice.

Optional parameters with `dataValue` or `serializedValue` examples are now enabled by default, matching legacy `value` examples. Explicitly disabled examples remain disabled.

Parameter-level `serializedValue` examples remain editable as raw wire text, including parameter names and percent encoding (for example, `term=hello` rather than `hello`). Media-level cookie examples are percent-encoded when sent, matching generated snippets. Generating snippets no longer modifies the input cookies.
