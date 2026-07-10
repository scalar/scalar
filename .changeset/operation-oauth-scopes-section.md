---
'@scalar/api-reference': minor
'@scalar/types': patch
---

Surface the required OAuth scopes for an operation as a dedicated "OAuth scopes" section below the description (above parameters), instead of only inside the "Auth Required" badge popover. Scopes are de-duplicated across security alternatives and shown in both the modern and classic layouts, as well as on AsyncAPI operations.
