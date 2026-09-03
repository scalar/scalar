---
'@scalar/api-reference': minor
---

feat(api-reference): lift schema expansion into a store so deep links and expand-all work at runtime

Expansion state used to live inside Headless UI's `<Disclosure>`, which reads `defaultOpen` once at mount and offers no controlled mode. That single fact is why a second deep link into an already-rendered operation silently did nothing, why a runtime expand-all could not exist, and why switching a `oneOf` variant threw away everything the reader had opened.

The schema tree now owns its own disclosure and resolves each node against a per-reference store: an explicit choice by the reader wins, then the nearest expand-all or collapse-all, then the standing baseline, then a live deep link, then whatever the node would have done on its own. Bulk actions clear the overrides beneath their own root first, so "Expand all" no longer skips every node the reader has touched. Cyclic nodes opt out of bulk expansion and the baseline, which is what stops a self-referential schema expanding forever.

Following a deep link now moves focus to the target as well as scrolling to it, and writes the path it opened into the store, so the expansion is permanent and collapsible rather than evaporating when the scroll target clears. Collapsing a subtree that contains the focused element moves focus up to that row's toggle instead of dropping it to the document body.

Model properties gain anchors: the models layout now passes a breadcrumb, which it never did while the operation layout always has.

Response header anchors in the tree layout no longer carry a doubled `headers.headers` path segment, and are now qualified by status code so each response's headers are addressable on their own. The legacy layout keeps the ids it has always had, doubled segment included, because readers have bookmarked them. An anchor of the old shape carried no status code, so it cannot be translated; following one now scrolls to the operation it belongs to instead of failing silently.

The store is created per `<ApiReference>` rather than module-global, so two references on one page do not share expansion. Markup, class names and layout are unchanged; the generated `id` and `aria-controls` values on schema disclosures differ, since they no longer come from Headless UI.
