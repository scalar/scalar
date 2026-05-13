import { Command } from 'commander'

import { cat } from '@/commands/cat'
import { generateBlog } from '@/commands/generate-blog'
import { generateReadme } from '@/commands/generate-readme'
import { packages } from '@/commands/packages'
import { updatePlaywrightDocker } from '@/commands/playwright-docker/push-container'
import { releaseNotesGenerator } from '@/commands/release-notes-generator'
import { syncReleaseNotesMarkdown } from '@/commands/release-notes-generator/sync-release-notes-markdown'
import { run } from '@/commands/run'
import { updateTestSnapshots } from '@/commands/update-snapshots'
import { wait } from '@/commands/wait'

import { version } from '../package.json'

const program = new Command()

program
  .name('@scalar-internal/build-scripts')
  .description('Internal CLI to quickly run repository scripts')
  .version(version)

program.addCommand(packages)
program.addCommand(wait)
program.addCommand(updateTestSnapshots)
program.addCommand(cat)
program.addCommand(run)
program.addCommand(updatePlaywrightDocker)
program.addCommand(generateReadme)
program.addCommand(generateBlog)
program.addCommand(releaseNotesGenerator)
program.addCommand(syncReleaseNotesMarkdown)
program.parse()
