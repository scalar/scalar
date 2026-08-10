---
'@scalar/workspace-store': minor
'@scalar/api-client': minor
'@scalar/types': minor
---

Control OAuth2 flow tabs from your OpenAPI document. Add `x-order` to a flow to set the order of the tabs in the auth section (the first tab is selected by default, so the lowest `x-order` also becomes the default flow), and add `x-scalar-ignore` to a flow to hide its tab — useful for flows that cannot run in the browser, like Client Credentials, which usually fails on CORS. `x-scalar-ignore` on a whole security scheme now hides it from the auth selector too.
