---
'@scalar/json-magic': patch
---

Emit array deletions highest-index-first in diff so removing more than one element applies correctly. Before, `diff({ items: [1, 2, 3, 4] }, { items: [1] })` emitted the deletes in ascending index order, and because `apply` removes array elements with `splice`, every delete after the first hit a stale index and left elements behind (`{ items: [1, 3] }`). Deletes on arrays are now ordered from the end of the array, so `apply(a, diff(a, b))` round-trips for arrays that lose any number of elements.
