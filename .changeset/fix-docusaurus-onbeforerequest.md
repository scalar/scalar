---
'@scalar/client-side-rendering': minor
'@scalar/docusaurus': patch
---

Fix function-valued configuration options (like `onBeforeRequest` and the request hooks) being dropped in the Docusaurus integration. Docusaurus JSON-serializes route props, which silently strips functions, so the config is now serialized to JavaScript in the plugin and injected as a script. Exposes a reusable `serializeConfigToJs` helper from `@scalar/client-side-rendering`.
