---
'@scalar/api-reference': patch
'@scalar/helpers': minor
---

Harden the API reference against untrusted OpenAPI documents:

- Link targets taken from the document (`info.license.url`, `info.termsOfService`,
  `info.contact.url`, `externalDocs.url`, `x-scalar-links`) and the direct download link are now
  checked against an allow list of protocols, so a document can no longer render a `javascript:`
  link that runs script when a reader clicks it. Unsafe values fall back to plain text.
- `deepMerge` (used by the exported `createEmptySpecification`) no longer walks into `__proto__`,
  `constructor`, or `prototype`, which previously let a document add properties to
  `Object.prototype`.
- `customCss` can no longer close the injected `<style>` tag, which mattered during server
  rendering where the value lands in the HTML stream verbatim.
- Added `rel="noopener noreferrer"` to the remaining `target="_blank"` links.

Adds `isSafeUrl` and `sanitizeUrl` to `@scalar/helpers/url/is-safe-url`.
