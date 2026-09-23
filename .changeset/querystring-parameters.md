---
'@scalar/workspace-store': minor
'@scalar/api-client': minor
'@scalar/api-reference': minor
'@scalar/blocks': patch
---

Support OpenAPI 3.2 `in: querystring` parameters, including content-based serialization, editing the entire query string, schema rendering, and generated request URLs.

Non-form whole-query content, including JSON delimiters, is percent-encoded in request URLs and code samples. Use an example with `serializedValue` on the parameter itself for URI-ready query content that must retain its existing encoding.

Preserve the encoding of named query values when they coexist with whole-query content in generated code samples, while encoding query authentication values once.

Explain why the whole-query editor disables adding named parameters. Existing named parameters follow the whole-query value, preserving duplicate keys for the server to interpret.
