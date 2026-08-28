---
'@scalar/mock-server': minor
---

feat: add a `quiet` option to suppress startup logging

`createMockServer()` prints authentication instructions for the security schemes of the document when it starts. That is helpful in a terminal, but it is noise when the mock server runs inside a test harness or another program, which so far left callers replacing the global console.

Pass `quiet: true` to skip those instructions. Diagnostics are not affected: warnings and errors about security schemes the mock server cannot handle, request validator compilation errors, and `x-seed` errors are printed either way.

```ts
const app = await createMockServer({ document, quiet: true })
```

The `MockServerOptions` type is now exported as well, so the options object can be named outside of the package.
