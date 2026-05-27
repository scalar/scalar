import { GENERIC_RELEASE_NOTES_PREAMBLE, buildReleaseNotesPreamble } from '@scalar/helpers/markdown/release-notes'
import { Command } from 'commander'

import { findReleaseNotesProductByJsonPath } from './products'
import { resolveUserPath } from './resolve-user-path'
import { readReleaseNotesJsonFile } from './write-release-notes-json'
import { writeReleaseNotesMarkdown } from './write-release-notes-markdown'

type SyncOptions = {
  json: string
  markdown: string
}

/**
 * Regenerate the derived `RELEASE_NOTES.md` from the source-of-truth JSON
 * without touching the JSON file or calling the AI release-notes generator.
 */
export const syncReleaseNotesMarkdown = new Command('sync-release-notes-markdown')
  .description(
    'Regenerate RELEASE_NOTES.md from RELEASE_NOTES.json (no AI, no JSON writes). Preserves entry order from the JSON file.',
  )
  .requiredOption('-j, --json <path>', 'Path to RELEASE_NOTES.json')
  .requiredOption('-m, --markdown <path>', 'Path to the derived RELEASE_NOTES.md to write')
  .action(async (options: SyncOptions) => {
    const jsonPath = resolveUserPath(options.json)
    const markdownPath = resolveUserPath(options.markdown)
    const entries = await readReleaseNotesJsonFile(jsonPath)
    const product = findReleaseNotesProductByJsonPath(jsonPath)
    const preamble = product ? buildReleaseNotesPreamble(product.displayName) : GENERIC_RELEASE_NOTES_PREAMBLE
    const result = await writeReleaseNotesMarkdown({ path: markdownPath, entries, preamble })
    console.log(`${result.created ? 'Created' : 'Updated'} ${result.path}`)
  })
