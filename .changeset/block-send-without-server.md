---
'@scalar/api-client': patch
'@scalar/api-reference': patch
'@scalar/helpers': patch
'@scalar/workspace-store': patch
---

fix(api-client): block invalid request URLs before send and surface `buildRequest` failures as results

Request construction now treats a bad merged URL as a first-class failure instead of throwing deep inside helpers. After `mergeUrls`, `resolveRequestFactoryUrl` rejects incomplete targets when strict mode applies: relative URLs, an empty server base, or path strings that still contain unresolved `{{variable}}` placeholders. Callers may set `allowMissingRequestServerBase` where a full absolute URL is intentionally optional (for example the embedded modal layout in `OperationBlock`, or API Reference `onBeforeRequest` hooks that build against the document origin).

`buildRequest` returns a `Result` (`ok` / `err`) with stable error codes such as `MISSING_REQUEST_SERVER_BASE`, `INVALID_REQUEST_FACTORY_URL`, and `BUILD_REQUEST_FAILED` for unexpected synchronous failures. Those failures are wrapped with `safeRun` from `@scalar/helpers`, which logs to `console.error` and maps throws to a string message on the result. The API Reference plugin path logs and skips `onBeforeRequest` when a preview request cannot be built, so user hooks never run against a half-built fetch payload.

Downstream packages (`api-client`, `api-reference`, `scalar-app` where applicable) unwrap the result, show toasts or logs, and avoid calling `sendRequest` until the URL is valid.
