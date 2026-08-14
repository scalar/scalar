---
'@scalar/json-magic': patch
---

Reject prototype-polluting path segments in diff, merge and apply. Documents reach these utilities from remote fetches and user files, and `JSON.parse` turns `__proto__` into a real own property, so `diff({}, JSON.parse('{"__proto__": {"polluted": "yes"}}'))` produced a changeset that wrote onto `Object.prototype` when applied. `diff` now skips the `__proto__`, `constructor` and `prototype` keys, `mergeObjects` no longer merges into them, and `apply` rejects any changeset containing them with an `InvalidChangesDetectedError` before touching the document.
