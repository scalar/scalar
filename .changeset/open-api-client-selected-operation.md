---
'@scalar/api-client': patch
'scalar-app': patch
---

feat: open the API client on the selected operation when launching from API Reference. The modal "Open API Client" link now includes `operation_path` and `operation_method` query params; scalar-app reads them after import and navigates to that request. Also fixes address bar blur replay when focus moves programmatically on first navigation into a draft operation.
