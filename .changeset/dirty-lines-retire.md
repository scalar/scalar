---
'@scalar/api-client': patch
---

fix: OAuth scope CRUD UI

- **Scope definitions vs selection**: adding, editing, or removing a scope on the OAuth flow now goes through dedicated workspace events `auth:upsert:scopes` and `auth:delete:scopes`, plumbed from `OAuth2` → `RequestAuthTab` → `RequestAuthDataTable` and registered in `initializeWorkspaceEventHandlers`. Updating checked scopes remains `auth:update:selected-scopes` without `newScopePayload`.
- **OAuthScopesInput**: row hover actions to edit or delete a scope; one shared add/edit modal; when the flow defines no scopes, the summary shows **No Scopes Defined**, **Select All** / **Deselect All** and the expand chevron are hidden, the disclosure summary is disabled, and **Add Scope** stays outside so it remains clickable; the `–` before a description is omitted when the description is empty or missing.
- **OAuthScopesAddModal**: supports edit mode (`scope` prop), inline errors for missing name and duplicate names (replacing toast-only validation), trims submitted names, and tests clean up teleported modal DOM between runs.
