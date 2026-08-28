---
'@scalar/mock-server': minor
---

feat: add a `logger` option to control startup logging

`createMockServer()` prints authentication instructions for the security schemes of the document when it starts. That is helpful in a terminal, but it is noise when the mock server runs inside a test harness or another program, which so far left callers replacing the global console.

Pass `logger: false` to silence those instructions, or a `(line: string) => void` sink to route them elsewhere:

```ts
const app = await createMockServer({ document, logger: false })
```

Diagnostics are not affected: warnings and errors about security schemes the mock server cannot handle, request validator compilation errors, and `x-seed` errors are printed either way.

`createAsyncApiMockServer()` already accepted a `logger` sink; it now takes the same `boolean | ((line: string) => void)` shape, so both factories are silenced and redirected the same way. It stays silent by default — pass `logger: true` to print its transport lifecycle lines.

The `MockServerLogger` type is now exported as well, so a custom sink can be typed outside of the package.
