---
'@scalar/json-magic': minor
'@scalar/workspace-store': patch
'@scalar/mock-server': patch
'@scalar/agent-chat': patch
---

Add generic document identity hooks for bundling and an explicit root URI option for reference proxies. Honor OpenAPI 3.2 `$self` through an OpenAPI plugin in workspace-store, including external documents and partial bundles, and enable it in OpenAPI bundling callers.

URI resolution now honors root-relative and protocol-relative URLs, query/fragment references, and trailing-slash directory bases for all bundler consumers. Absolute non-HTTP identifiers remain unchanged instead of becoming filesystem paths; loader support is unchanged. Relative HTTP references retain query strings and fragments and are emitted only when they round-trip to the original URL.

Preserve authored reference spellings through serialized partial bundles and editable exports, while keeping older OpenAPI resolution and configured loader restrictions unchanged.
