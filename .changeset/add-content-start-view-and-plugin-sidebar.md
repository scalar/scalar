---
'@scalar/api-reference': minor
'@scalar/types': minor
'@scalar/schemas': minor
---

Add `content.start` plugin view slot and `sidebar` visibility option for plugin view components.

- **`content.start`**: A new view slot that renders custom plugin components **before** the Introduction/Info section (at the top of the content area).
- **`sidebar` option on `ViewComponent`**: Plugins can now opt-in to display a sidebar entry for their custom views by providing `sidebar: { show: true, label: 'My Page' }`. Omitting `sidebar` or setting `show: false` hides the entry from the sidebar.
