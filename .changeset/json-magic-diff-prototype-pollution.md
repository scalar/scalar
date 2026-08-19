---
'@scalar/json-magic': patch
'@scalar/helpers': minor
---

Stop the diff utilities from writing through the prototype chain. Documents reach them from remote fetches and user files, and `JSON.parse` turns `__proto__` into a real own property, so `apply({}, diff({}, JSON.parse('{"__proto__": {"polluted": "yes"}}')))` used to write onto `Object.prototype` and poison every object in the runtime. `diff`, `isKeyCollisions` and `mergeObjects` now skip the `__proto__`, `constructor` and `prototype` keys, the trie backing `merge` keys its children on a null prototype, and `apply` rejects any changeset containing one of those segments with an `InvalidChangesDetectedError` before it touches the document.

This does change behaviour for documents that legitimately carry a property with one of those names, which JSON allows and a schema is free to describe. `diff` no longer compares such a property, so editing it on its own is not reported as a change, and a merge that previously surfaced it as a conflict now merges cleanly. The property still travels along when its parent object is added or updated wholesale, because a new subtree is emitted as a single value. This trade-off matches `preventPollution`, which the rest of the codebase already applies to untrusted keys.

`@scalar/helpers` gains an `isPollutionKey` predicate next to the existing `preventPollution`, so the list of dangerous keys lives in one place.
