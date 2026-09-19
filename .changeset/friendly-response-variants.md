---
'@scalar/api-reference': patch
'@scalar/workspace-store': patch
'@scalar/mock-server': patch
---

Add a picker for generated response examples with anyOf or oneOf schema variants.

Apply union selections to primitive and array examples in the shared generator without reusing the selection for nested unions.

The shared generator change also affects request examples, snippets, mock responses, and AsyncAPI payloads: root primitive/array unions now generate their chosen branch before type inference from sibling properties or items. For example, a string schema with `oneOf: [{ const: "first" }, { const: "second" }]` now generates `"first"` by default, and selecting the second branch generates `"second"`. Keywords for unrelated types do not force object/array generation. Root selections are consumed once; nested unions retain their own default or path-specific choice.

Do not show a response variant picker for an empty enum, which permits no valid alternatives.

Preserve the generated branch shape in mock HTTP responses instead of re-wrapping selected primitive values as arrays based on root sibling `items`. Explicit authored examples retain the existing array normalization.
