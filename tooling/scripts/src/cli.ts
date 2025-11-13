import { Command } from 'commander'

import { cat } from '@/commands/cat'
import { generateReadme } from '@/commands/generate-readme'
import { packages } from '@/commands/packages'
import { updatePlaywrightDocker } from '@/commands/playwright-docker/push-container'
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
program.parse()
