---
'@scalar/helpers': minor
---

feat(helpers): add `serializeReleaseNotes` to `@scalar/helpers/markdown/release-notes` so the release-notes generator can emit a human-friendly `RELEASE_NOTES.md` view from the source-of-truth `RELEASE_NOTES.json` on every release. The default preamble documents the JSON file as the source of truth so contributors do not edit the derived markdown by mistake.
