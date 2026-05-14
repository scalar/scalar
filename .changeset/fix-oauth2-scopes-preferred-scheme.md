---
'@scalar/workspace-store': patch
---

fix: initialize selection when updating OAuth2 scopes with preferredSecurityScheme

When preferredSecurityScheme is used, the selection is computed on-the-fly by getSelectedSecurity but not persisted to the auth store. This caused updateSelectedScopes to fail silently when users tried to select scopes, as it couldn't find a stored selection to update.

The fix initializes the selection in the auth store when it doesn't exist, allowing scope updates to work correctly with preferredSecurityScheme.
