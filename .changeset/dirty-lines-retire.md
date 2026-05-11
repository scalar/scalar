---
'@scalar/api-client': patch
---

fix: improve OAuth scopes selector empty and missing-description states

Polish the OAuth scopes selector in `@scalar/api-client` for two edge cases:

- When the OAuth flow defines no scopes, the row now reads **"No Scopes Defined"**, the **Deselect All** / **Select All** buttons are hidden, and the `>` expand chevron is hidden. The disclosure summary control is disabled so the empty panel cannot be expanded, and **Add Scope** sits outside that disabled control so it stays clickable.
- When an individual scope has no description (empty string or missing), the trailing `–` separator is no longer rendered next to the scope label.
