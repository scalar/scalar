---
'@scalar/json-magic': patch
---

Explain the root-level change `apply` cannot handle, and document that `diff`, `merge` and `apply` share references with the documents they work on.

A change with an empty path asks to replace the document itself, which `apply` cannot do since it writes through the parent container of each path. It used to fail with `Process aborted. Path  at depth 0 is undefined, check diff object` halfway through a changeset, and now says so up front and leaves the document untouched:

```ts
// `diff` emits a change with an empty path whenever the two documents differ at the root
apply({ name: 'John' }, [{ path: [], changes: [1, 2], type: 'update' }])
// InvalidChangesDetectedError: Process aborted. Root-level replacement is not supported, the
// change targets the document itself instead of a property inside it
```

The changes a diff carries are live references into the documents it compared, so `merge` writes into the document behind its second diff list and an applied document stays structurally shared with the diff. That contract is now spelled out on `diff`, `merge` and `apply` — deep clone the documents when a caller needs isolation.
