---
'@scalar/workspace-store': minor
'@scalar/api-client': patch
'@scalar/api-reference': patch
'@scalar/blocks': patch
---

Share OpenAPI 3.2 example-value selection across request bodies, response examples, and code snippets. Preserve serialized payloads verbatim, serialize structured JSON strings correctly, retain falsy values, and replace original example sources after body edits. Keep dataValue and serializedValue during document ingestion.

Editing a request body, including form fields, discards its authored `externalValue` URL and replaces it with the edited inline value in the workspace and exported API description. Rendering or focusing a form field preserves the external source.
