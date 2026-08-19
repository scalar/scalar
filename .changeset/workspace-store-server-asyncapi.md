---
'@scalar/workspace-store': patch
---

Keep AsyncAPI documents intact in the server workspace store. `createServerWorkspaceStore` ingested every document as OpenAPI, so an AsyncAPI document lost its `channels` and `operations`, had `asyncapi` replaced by an empty `openapi` string, and gained an empty `paths` object — leaving `x-scalar-navigation` with nothing but Introduction and Models. AsyncAPI documents now take their own ingestion path, mirroring the client store's: the AsyncAPI upgrader runs instead of the OpenAPI one, the OpenAPI coercion is skipped, `x-original-aas-version` is preserved, and navigation is built with `traverseAsyncApiDocument` so `asyncapi-channel` and `asyncapi-operation` entries reach the sidebar.
