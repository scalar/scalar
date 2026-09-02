---
'@scalar/api-reference': minor
'@scalar/schemas': minor
'@scalar/types': minor
---

feat(api-reference): one disclosure grammar across every surface in the tree layout

The tree layout now reaches the surfaces the schema renderer never covered. Response headers fold into the tree as a child group named Headers, keyed into the expansion store so expand-all and deep links finally reach them — and the headers card's long-standing CSS syntax error is fixed along the way. Callbacks trade their native `details`/`summary` for the gutter control, and gain breadcrumbs, so a property inside a callback body is addressable for the first time. AsyncAPI message headers and payloads gain breadcrumbs the same way. Parameter rows keep rendering their type, required marker and description inline in both layouts: a disclosure may hide child elements, never child information, and the classic layout starts passing `collapsableItems` — previously omitted, which silently made `expandAllResponses` a no-op there. Model properties in the classic layout gain anchors.

Group titles — Body, Responses, Query Parameters, Callbacks — become real headings through the document outline (`operationSection`, level 4), never hardcoded tags.

One flagged feature ships with this: `schemaKeyboardNav` (default off) adds APG-tree arrow-key navigation over the gutter toggles.
