import { appendFile } from 'node:fs/promises'

import { hasBuiltInProviderApiKey, readReleaseNotesConfig } from '../../../packages/release-notes/dist/index.js'
import { backfillReleaseNotes } from './backfill'

const config = await readReleaseNotesConfig({})
const dryRun = process.env.BACKFILL_DRY_RUN === 'true'
if (!dryRun && config.builtInProviderName && !hasBuiltInProviderApiKey(config.builtInProviderName, config.apiKeyEnv)) {
  throw new Error('The release-notes provider API key is missing.')
}
await backfillReleaseNotes({
  root: process.cwd(),
  config,
  since: process.env.BACKFILL_SINCE ?? '2026-06-01',
  dryRun,
  resumeRef: process.env.BACKFILL_RESUME_REF,
  onPrepared: async (): Promise<void> => {
    if (process.env.GITHUB_OUTPUT) {
      await appendFile(process.env.GITHUB_OUTPUT, 'checkpoint-restored=true\n')
    }
  },
})
