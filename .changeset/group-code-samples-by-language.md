---
'@scalar/api-client': patch
---

Group custom x-codeSamples by language in the code samples dropdown

Previously, custom code samples from `x-codeSamples` were displayed in a single flat "Code Examples" group. This change groups them by language, similar to how auto-generated snippetz clients are grouped.

For example, if an operation has two Python code samples (sync and async variants), they will now appear under a "Python" group with both options selectable, instead of appearing as separate top-level items.
