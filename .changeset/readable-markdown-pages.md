---
'@scalar/openapi-to-markdown': minor
---

Make single-page Markdown easier to read, especially for AI agents reading `llms.txt` exports.

- An operation, webhook or model page now starts with that item as its `#` title and uses `##` sections, without the API's document header. An empty API version is never printed.
- Schema property descriptions keep their Markdown: paragraphs, links, inline code and fenced code blocks are no longer flattened into one escaped line. A parameter description is no longer repeated by its schema.
- Each property is one line with its name, type and annotations. Nullable unions read as `string | null`, single-branch `allOf` wrappers as the wrapped type, unions of plain types as one type, `const` and `enum` schemas without a `type` as their inferred JSON type, and arrays of simple items as `array of …`. Composition branches are listed one per item, with discriminator values beside their branch.
- Parameters are grouped by location. Responses that return the same schema and media type are grouped into one entry, such as a list of error statuses.
- In linked mode, references are shown as a link in the property's type. Primitive, enum and `const` schemas and aliases of them are written in place instead of linked; set `schemaReferences.inlinePrimitives: false` to link them. Generated examples are left out without a placeholder, while a model page generates an example of its own schema with linked schemas as empty stubs.
- The Authentication section is left out when the API description declares no security requirements, and only an explicit `security: []` says that no authentication is required. Security schemes are summarized on one line, for example "API key in header `X-Api-Key`", instead of printed as JSON.
