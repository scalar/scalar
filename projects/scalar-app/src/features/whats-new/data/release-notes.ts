/**
 * Curated, user-facing release notes for the Scalar app.
 *
 * Entries are imported directly from `projects/scalar-app/RELEASE_NOTES.json`
 * at build time. The JSON file is the single source of truth - do not
 * edit this file to add a new release; update `RELEASE_NOTES.json`
 * instead (manually for a one-off, or via the release-notes generator
 * on a normal release, which also regenerates the human-friendly
 * `RELEASE_NOTES.md` view).
 *
 * The release-notes generator folds the API client's CHANGELOG into the
 * same scalar-app entry on every release, so changes that technically
 * live in `@scalar/api-client` still surface in this list - the API
 * client is the headline dependency, and the modal reads as a single
 * release note for the parent app.
 *
 * Sorted newest-first so the `WhatsNewModal` can rely on `releaseNotes[0]`
 * being the latest release.
 */
import releaseNotesJson from '@/../RELEASE_NOTES.json' with { type: 'json' }

import type { ReleaseNote } from '../types'

export const releaseNotes: ReleaseNote[] = releaseNotesJson as ReleaseNote[]
