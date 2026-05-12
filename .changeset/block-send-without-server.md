---
'@scalar/api-client': patch
'@scalar/api-reference': patch
'@scalar/helpers': patch
'@scalar/workspace-store': patch
---

fix(api-client): validate merged request URLs in `resolveRequestFactoryUrl` (after `mergeUrls`); `buildRequest` propagates the same `Result`; incomplete merged strings include path-only targets and leftover `{{var}}` segments unless `allowMissingRequestServerBase` is set; `buildRequest` maps unexpected throws via `@scalar/helpers` `safeRun`; log when `onBeforeRequest` is skipped because `buildRequest` failed (`map-config-plugins`); `safeRun` overloads live in `@scalar/helpers` (scalar-app imports it directly)
