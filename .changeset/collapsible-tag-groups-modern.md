---
'@scalar/api-reference': minor
'@scalar/components': minor
'@scalar/sidebar': patch
---

feat(api-reference): collapsible `x-tagGroups` in modern layout

The modern sidebar now renders each `x-tagGroups` entry as a collapsible
section with an expand/collapse toggle. Groups default to expanded so the
existing flat rendering is preserved for users who did not interact with the
sidebar. `ScalarSidebarSection` gained an opt-in `collapsible` prop plus an
`open` model and `toggle` event.
