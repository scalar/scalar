---
'@scalar/mock-server': minor
---

feat: add a `quiet` option to suppress startup logging

`createMockServer()` prints authentication instructions for the security schemes of the document when it starts. That is helpful in a terminal, but it is noise when the mock server runs inside a test harness or another program, which so far left callers replacing the global console to get a clean output.

Pass `quiet: true` to skip the startup output. Warnings and errors are not affected.

```ts
const app = await createMockServer({ document, quiet: true })
```
