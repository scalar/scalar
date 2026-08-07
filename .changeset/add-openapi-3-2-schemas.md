---
'@scalar/workspace-store': patch
---

Add OpenAPI 3.2 schema definitions under `schemas/v3.2` (a copy of the v3.1 strict and loose schemas) with the new 3.2 fields: tag `summary`/`parent`/`kind`, response `summary` and optional `description`, server `name`, security-scheme `deprecated` and OAuth2 `oauth2MetadataUrl`, the OAuth device authorization flow, root `$self`, path item `query` and `additionalOperations`, parameter `in: querystring`, media type `itemSchema`/`prefixEncoding`/`itemEncoding`/`description`, nested encoding, example `dataValue`/`serializedValue`, components `mediaTypes`, and XML `nodeType`. The workspace store still uses the v3.1 schemas; this only adds the v3.2 set as groundwork.
