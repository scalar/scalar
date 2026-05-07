---
'@scalar/helpers': minor
---

feat(helpers): add `parseReleaseNotes` and `serializeReleaseNotes` to `@scalar/helpers/markdown/release-notes`. These power the API client's "What's new" modal and the release-notes generator, so a single round-trippable markdown format is shared between the producer and consumer of `RELEASE_NOTES.md`.
