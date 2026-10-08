---
'@scalar/workspace-store': patch
'@scalar/api-client': patch
---

Show **Reset to default** on authentication fields only when the field has a default that differs from its current value (the document or configured value, or the current page URL for the OAuth2 redirect URL). A cleared OAuth2 access token keeps the action so you can get back to the Authorize form. The show password toggle only appears once a field has a value, and an emptied field goes back to masked.
