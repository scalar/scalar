---
'@scalar/json-magic': minor
---

Add `outputBase` to give bundled local schemas public output identities without changing file loading. Relative identities and resolved references can now serialize identically across checkout directories. In-memory schemas without an origin use a virtual output base; explicitly absolute identifiers, preserved references, and unresolved source locations retain their meaning.
