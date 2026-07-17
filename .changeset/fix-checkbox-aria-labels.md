---
'@scalar/api-client': patch
---

Fix missing accessible names on request/scopes table checkboxes and their row delete buttons. `DataTableCheckbox` now accepts an `ariaLabel` prop, and `RequestTableRow`/`OAuthScopesInput` pass row-specific labels (e.g. "Include x-api-key in request", "Select read:users scope") so screen reader users can tell which row a control acts on.
