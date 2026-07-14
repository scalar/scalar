---
'@scalar/types': patch
'@scalar/snippetz': patch
---

Tie a snippetz plugin's `client` to its `target` at the type level. Before, a plugin could pair any target with any client (for example `node` + `curl`) without a type error. Now `target: 'node'` only allows node clients, and TypeScript catches mistakes like using the display title `'Fetch'` where the lowercase client id `'fetch'` is expected.
