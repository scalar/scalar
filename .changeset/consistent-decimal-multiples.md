---
'@scalar/json-schema-validator': patch
'@scalar/mock-server': patch
---

Use shortest round-trip decimal values consistently for multipleOf checks, including large JSON integers and positive exponents. Fast-path safe integers and share keyword registration across validators.
