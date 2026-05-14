---
'scalar-app': patch
---

feat(scalar-app): add a "What's new" modal accessible from the Get Started page so users can browse curated release notes inside the client. A small accent dot appears on the trigger when there are unseen releases. Release notes are bundled with the package via `RELEASE_NOTES.json` (the source of truth, imported directly so no runtime markdown parsing is needed) and filtered to the version the user has actually installed. The release-notes generator updates the JSON file during `pnpm changeset version` and regenerates a derived `RELEASE_NOTES.md` view alongside it.
