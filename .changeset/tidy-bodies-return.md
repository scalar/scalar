---
"@scalar/api-client": minor
"@scalar/workspace-store": minor
"@scalar/types": patch
---

Add a request body reset action that restores the original example, falling back to schema-generated values, without refreshing the page.

Expose `ObjectDoc.documentSource` as the base URI for resolving relative references in object documents. Add translation keys for restoring a body and creating an example from its schema.

Resolved request body baselines are included in workspace exports but are not persisted in IndexedDB. After an IndexedDB reload or loading an older export, the first reset reconstructs the baseline from the original document, which may refetch external references and does not reapply configured overrides.
