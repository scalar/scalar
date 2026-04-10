---
'@scalar/api-reference': patch
'@scalar/workspace-store': patch
---

fix: respect media type order and handle allOf with metadata-only items

- Issue #8768: Changed media type selection to respect the order defined in the OpenAPI spec instead of hardcoded priority
- Issue #8753: Fixed allOf handling to skip metadata-only items (description, title, etc.) that don't contribute to the schema structure
- Issue #8752: 204 responses already render correctly with 'No Body' message
