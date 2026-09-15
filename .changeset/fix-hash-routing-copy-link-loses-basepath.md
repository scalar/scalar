---
'@scalar/api-reference': patch
---

fix(api-reference): preserve host-app hash prefix when copying section links

When scalar is embedded inside a hash-routed SPA (e.g. the page URL is
`http://localhost:3000/#docs/api-spec`), copying a section anchor link was
producing a broken URL like:

```
http://localhost:3000/#tag/payer-list
```

instead of the correct:

```
http://localhost:3000/#docs/api-spec/tag/payer-list
```

This happened because `makeUrlFromId` with no `basePath` configured was
blindly overwriting the entire hash fragment, losing the host-app prefix.

The fix detects the existing host-app hash prefix and preserves it when
constructing the copied URL. Navigating between sections also correctly
replaces only the section portion without duplicating the prefix.

The recommended long-term solution for apps with hash-based routing is to
configure `pathRouting: { basePath: '#docs/api-spec' }`, which gives scalar
full ownership of its hash namespace.
