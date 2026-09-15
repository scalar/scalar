---
'@scalar/json-magic': patch
'@scalar/workspace-store': patch
'@scalar/mock-server': patch
'@scalar/agent-chat': patch
---

Add generic document identity hooks for bundling and an explicit root URI option for reference proxies. Honor OpenAPI `$self` through an OpenAPI plugin in workspace-store, including external documents and partial bundles, and enable it in OpenAPI bundling callers.
