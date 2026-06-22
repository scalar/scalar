import { buildReleaseNotesPreamble } from '@scalar/helpers/markdown/release-notes'
import { Command } from 'commander'

import { type CliConfigOverrides, readReleaseNotesConfig } from '../config/read-config'
import type { ReleaseNotesConfig } from '../config/types'
import { resolveUserPath } from '../core/paths'
import { findReleaseNotesProductByJsonPath } from '../core/products'
import { readReleaseNotesJsonFile } from '../writers/write-release-notes-json'
import { writeReleaseNotesMarkdown } from '../writers/write-release-notes-markdown'

type SyncOptions = {
  json: string
  markdown: string
  config?: string
}

export const createSyncReleaseNotesMarkdownCommand = (baseConfig: ReleaseNotesConfig = {}): Command => {
  return new Command('sync-release-notes-markdown')
    .description('Regenerate RELEASE_NOTES.md from RELEASE_NOTES.json (no AI, no JSON writes).')
    .requiredOption('-j, --json <path>', 'Path to RELEASE_NOTES.json')
    .requiredOption('-m, --markdown <path>', 'Path to the derived RELEASE_NOTES.md to write')
    .option('--config <path>', 'Path to a release-notes config file')
    .action(async (options: SyncOptions) => {
      const config = await readReleaseNotesConfig({ config: options.config } satisfies CliConfigOverrides, baseConfig)
      const jsonPath = resolveUserPath(options.json)
      const markdownPath = resolveUserPath(options.markdown)
      const entries = await readReleaseNotesJsonFile(jsonPath)
      const product = findReleaseNotesProductByJsonPath(jsonPath, config.products)
      const preamble = buildReleaseNotesPreamble(product?.displayName)
      const result = await writeReleaseNotesMarkdown({ path: markdownPath, entries, preamble })
      console.log(`${result.created ? 'Created' : 'Updated'} ${result.path}`)
    })
}

export const syncReleaseNotesMarkdown = createSyncReleaseNotesMarkdownCommand()
