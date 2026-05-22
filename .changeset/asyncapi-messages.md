---
'@scalar/workspace-store': minor
'@scalar/api-reference': minor
'@scalar/types': patch
---

feat(api-reference): render AsyncAPI messages

AsyncAPI documents now render a "Messages" section. The workspace-store builds an `x-scalar-navigation` tree for AsyncAPI documents (an Introduction entry plus a `Messages` container with one entry per `components.messages` entry), and the api-reference renders a matching section in the document body. Sidebar clicks scroll to the matching body anchor, mirroring how Models behaves for OpenAPI.

Search indexing, a dedicated sidebar icon, channel/operation rendering, and a `hideMessages` config option remain out of scope for this slice.
