---
'@scalar/api-reference': patch
---

Fix missing chunks after a release when a cached ESM entry point is loaded from an unversioned npm CDN URL. The generated loader selects its own exact release using a relative package URL, preserving the CDN hostname and path prefix. This supports jsDelivr, UNPKG, and other hosts with versioned npm package paths while keeping latest as the default. Custom self-hosted paths continue loading the bundle next to the entry point.
