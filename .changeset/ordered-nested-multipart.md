---
'@scalar/workspace-store': patch
'@scalar/blocks': patch
---

Support positional and nested multipart request encoding with prefixEncoding, itemEncoding, and nested encoding objects. Keep generated code snippets in sync with multipart request bodies.

Reject ambiguous named positional items and multipart nesting beyond eight levels. Use a stable fallback root for XML parts.

Document multipart content-type defaults and wildcard selection policies. Route structured XML parts through a shared adapter while retaining legacy root-name behavior.

Regenerate multipart boundaries that collide with resolved text or nested delimiters, keeping binary payload bytes intact.
