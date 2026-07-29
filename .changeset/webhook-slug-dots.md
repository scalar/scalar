---
'@scalar/workspace-store': patch
---

fix: keep dots in webhook navigation deep links

Webhook event names that use dots (for example `account_holder.created`) had the
dot dropped when building the navigation id, joining adjacent words into
`account-holdercreated`. Dots are now kept, producing `account-holder.created`.
