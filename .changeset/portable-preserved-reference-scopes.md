---
'@scalar/json-magic': patch
---

Keep references across schema resource scopes portable when preserving selected references, including anonymous outer documents, cyclic dependencies, and local-file schema identities.

The Node file loader now accepts escaped `file:` URIs with the same directory and symlink confinement as native paths. Documents retrieved over HTTP(S) cannot load filesystem targets. Keep malformed local URI references recoverable and omit dynamic anchor declarations when copying anonymous schemas into another resource.
