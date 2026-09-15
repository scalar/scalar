---
'@scalar/api-reference': patch
---

Preserve host-app hash prefixes when copying section links or navigating in embedded API references. Detect the prefix from the loaded navigation once and use it consistently when writing links, reopening them, and restoring browser history. Explicit `pathRouting.basePath` configuration takes precedence and is recommended when host routes overlap with Scalar section IDs.
