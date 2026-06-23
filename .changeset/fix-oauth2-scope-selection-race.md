---
'@scalar/workspace-store': patch
'@scalar/api-client': patch
---

Fix OAuth2 scope checkboxes losing selections on quick clicks. Each scope is now toggled against the stored selection instead of a list computed in the component, so the "Scopes Selected" counter and the scopes sent to the token endpoint stay in sync with the checkboxes.
