---
'@scalar/components': minor
'@scalar/sidebar': minor
---

Give sidebar groups whose label is a link their own expand and collapse button.

Group labels render as anchors so the navigation stays crawlable, which left the caret as a plain `<div>` inside the link. That gave each row a single focusable element: pressing Enter followed the link (expanding the group as a side effect) and nothing collapsed it again, `aria-expanded` sat on the link rather than on a control that can toggle, and the caret's screen reader text ran into the link's accessible name ("Authentication Close Group").

- `@scalar/components`: new `ScalarSidebarGroupToggleButton` and `ScalarSidebarGroupToggleSpacer`, which `ScalarSidebarGroup` now uses for its discrete toggle in place of an inline button. `ScalarSidebarGroup` no longer sets `aria-expanded` on the group label when `discrete` is set, because the toggle button is what owns the expanded state.
- `@scalar/sidebar`: a group renders a discrete toggle whenever `getHref` returns a URL for it, so tags, models and documents in the reference sidebar each get a toggle button of their own. The caret is now focusable and operable from the keyboard, `aria-expanded` moved from the label onto that button, and the button is named after the group it belongs to ("Open Group - Authentication") so a screen reader user can tell the toggles apart. Groups without an href are unchanged, so the client sidebar keeps its current behavior.
