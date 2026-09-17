---
'@scalar/workspace-store': patch
'@scalar/blocks': patch
---

Support positional and nested multipart request encoding with prefixEncoding, itemEncoding, and nested encoding objects. Keep generated code snippets in sync with multipart request bodies.

Reject ambiguous named positional items and multipart nesting beyond eight levels. Use a stable fallback root for XML parts.
