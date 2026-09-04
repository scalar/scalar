---
'@scalar/mock-server': minor
---

Run `x-handler` and `x-seed` code in a real sandbox

Handler and seed code used to run with the `Function` constructor, which gave it full access to the Node.js host (`process`, `require`, and more). It now runs inside a QuickJS WebAssembly sandbox with memory and time limits, so even untrusted code from a remote or `$ref`-loaded document cannot reach the host.

The `store`, `faker`, `req`, `res`, `schema`, and `seed` APIs work as before. The one exception is faker methods that take a callback (for example `faker.helpers.multiple(fn)`), which are no longer supported because functions cannot cross the sandbox boundary.
