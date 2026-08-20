---
'@scalar/workspace-store': minor
'@scalar/api-reference': minor
'@scalar/api-client': minor
'@scalar/schemas': minor
'@scalar/types': minor
---

Add a way to open the request body editor in the Form view by default. Set the `defaultRequestBodyView: 'form'` config option, or the `x-scalar-default-request-body-view` extension in your OpenAPI document (which also works per source). Defaults to `raw`, and falls back to `raw` when a body cannot be shown as a form.
