#!/usr/bin/env node
import { createRequire } from 'node:module'

import { Command } from 'commander'

import { createReleaseNotesGeneratorCommand } from './commands/generate'
import { createSyncReleaseNotesMarkdownCommand } from './commands/sync-markdown'

const require = createRequire(import.meta.url)
const { version } = require('../package.json') as { version: string }

export const createReleaseNotesCli = (): Command => {
  const program = new Command()
  program
    .name('scalar-release-notes')
    .description('Generate curated release notes from Changesets changelogs')
    .version(version)

  program.addCommand(createReleaseNotesGeneratorCommand(), { isDefault: true })
  program.addCommand(createSyncReleaseNotesMarkdownCommand())

  return program
}

createReleaseNotesCli().parse()
