---
'@scalar/json-magic': patch
---

Treat an array and a plain object on the same path as a merge conflict. `isKeyCollisions` compared the two containers key by key, so an array and an object holding the same values under the same indices looked mergeable:

```ts
isKeyCollisions([1, 2], { 0: 1, 1: 2 }) // → false, so the two were merged
mergeObjects([1, 2], { 0: 1, 1: 2 }) // → [1, 2], the object silently absorbed
```

In practice that meant one side turning `servers: ['https://example.com']` into `servers: { 0: 'https://example.com' }` merged cleanly and lost the container the user picked. Both sides now surface as a conflict to resolve, matching the guard `diff` already applies when a container changes type.
