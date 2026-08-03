---
'@scalar/workspace-store': patch
'@scalar/api-reference': patch
---

fix: keep dots in webhook navigation deep links

Webhook event names that use dots (for example `account_holder.created`) had the
dot dropped when building the navigation id, joining adjacent words into
`account-holdercreated`. Dots are now kept, producing `account-holder.created`.

Old deep links using the dropped-dot slug are redirected to the new slug, so
existing bookmarks keep resolving.
