---
'@scalar/json-magic': patch
'@scalar/helpers': patch
---

Reject prototype-polluting path segments in diff, merge and apply. Documents reach these utilities from remote fetches and user files, and `JSON.parse` turns `__proto__` into a real own property, so `diff({}, JSON.parse('{"__proto__": {"polluted": "yes"}}'))` produced a changeset that wrote onto `Object.prototype` when applied. `diff` now skips the `__proto__`, `constructor` and `prototype` keys, `mergeObjects` no longer merges into them, the trie backing `merge` keys its children on a null prototype, and `apply` rejects any changeset containing them with an `InvalidChangesDetectedError` before touching the document. `@scalar/helpers` gains an `isPollutionKey` predicate next to the existing `preventPollution`, so the list of dangerous keys lives in one place.
