---
'@scalar/api-reference': minor
'@scalar/helpers': minor
'@scalar/sidebar': minor
---

Render sidebar navigation as anchor links instead of buttons.

- `@scalar/sidebar`: `ScalarSidebar` and `SidebarItem` accept a new `getHref` callback. When it returns a URL for an item, that item renders as a real link — this covers every entry except tag-group headings, which are section labels rather than navigation targets. Plain left clicks on the link still emit `selectItem` for in-app navigation (with the default navigation prevented), modified clicks are left to the browser so links can be opened in a new tab, and clicks on decorator content outside the link keep their native behavior. Items are built with the existing `button` slot on `ScalarSidebarItem` and `ScalarSidebarGroup`, so `@scalar/components` needs no new API to support this.
- `@scalar/api-reference`: the sidebar now passes `getHref` using the new SSR-safe `makeHrefFromId` helper, so the rendered sidebar contains real anchor tags whose paths match the URLs pushed to history (the hrefs are relative, so they do not carry the current query string). With path routing this makes the navigation crawlable and indexable by search engines; with hash routing and hash-base-path routing the fragment hrefs improve link semantics and open-in-new-tab behavior, but search engines do not treat fragments as separate URLs — configure `pathRouting` if URL discovery is the goal. Note that sidebar entries now follow standard link keyboard semantics (Enter activates them, Space scrolls the page), and links inside collapsed groups are only present in server-rendered HTML for groups that are expanded during SSR (for example via `defaultOpenAllTags`).
- `@scalar/helpers`: new `isPlainLeftClick` helper in `dom/is-plain-left-click` for deciding when a click should be hijacked for client-side navigation.
