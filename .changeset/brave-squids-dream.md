---
'scalar-app': minor
---

feat(scalar-app): add a "What's new" modal accessible from the Get Started page so users can browse curated release notes inside the client. A small accent dot appears on the trigger when there are unseen releases. Release notes are bundled with the package via `RELEASE_NOTES.md` and parsed at runtime, filtered to the version the user has actually installed - the file is updated automatically by the release-notes generator during `pnpm changeset version`.
