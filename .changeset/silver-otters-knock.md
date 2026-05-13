---
'@scalar/api-client': patch
'@scalar/helpers': patch
'@scalar/workspace-store': patch
---

fix(api-client): request body content types — OpenAPI extras, MIME labels, and "Other" without auto Content-Type

The request body dropdown lists built-in types first, then any additional media types from the OpenAPI operation. Labels use the MIME essence (no `charset` in the label). The **Other** option is available again for a raw body: it does **not** add an automatic `Content-Type` header (users can set one manually). Code snippets avoid injecting `Content-Type: other`.

`getDefaultHeaders` and `filterDisabledDefaultHeaders` are exported from `@scalar/workspace-store/request-example`; the API client uses them for code snippets instead of a duplicate helper.
