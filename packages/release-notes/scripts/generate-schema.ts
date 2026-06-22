/**
 * Generate the release notes JSON Schema from Zod types in `src/types.ts`.
 */

import path from 'node:path'

import {
  DEFAULT_RELEASE_NOTES_SCHEMA_ID,
  DEFAULT_RELEASE_NOTES_SCHEMA_PATH,
  DEFAULT_RELEASE_NOTES_SCHEMA_TITLE,
  writeReleaseNotesJsonSchema,
} from '../src/writers/write-release-notes-schema'

const packageRoot = path.join(import.meta.dirname, '..')
const outputPath = path.join(packageRoot, DEFAULT_RELEASE_NOTES_SCHEMA_PATH)

const result = await writeReleaseNotesJsonSchema({
  path: outputPath,
  id: DEFAULT_RELEASE_NOTES_SCHEMA_ID,
  title: DEFAULT_RELEASE_NOTES_SCHEMA_TITLE,
})

console.log(`${result.changed ? 'Updated' : 'Unchanged'} ${result.path}`)
