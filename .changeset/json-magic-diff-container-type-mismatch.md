---
'@scalar/json-magic': patch
---

Treat array/object container mismatches as a single update in diff instead of descending into per-index adds. Before, `diff({ tags: {} }, { tags: ['x', 'y'] })` walked the array's indices as object keys and emitted per-index `add` differences, so `apply` wrote numeric string properties onto the existing object and produced the corrupted hybrid `{ tags: { '0': 'x', '1': 'y' } }`. A container type change (either direction) is now one `update` difference carrying the full new value, and applying it replaces the container correctly.
