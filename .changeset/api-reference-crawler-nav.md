---
'@scalar/api-reference': minor
---

Expose every sidebar URL to crawlers in server-rendered HTML. The interactive sidebar keeps the children of collapsed groups out of the DOM, so links to operations and models inside collapsed tags were missing from server-rendered output unless `defaultOpenAllTags` was enabled. The server-rendered HTML now includes a hidden, flat list of plain anchors for every navigation entry, so crawlers can discover all deep links without executing JavaScript. The list is dropped right after hydration and never affects the interactive experience.
