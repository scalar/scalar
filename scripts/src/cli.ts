import { Command } from 'commander'
import { version } from '../package.json'
import { packages } from '@/commands/packages'
import { wait } from '@/commands/wait'
import { cat } from '@/commands/cat'
import { updateTestSnapshots } from '@/commands/update-snapshots'
import { run } from '@/commands/run'

const program = new Command()

program.name('@scalar/scripts').description('Internal CLI to quickly run repository scripts').version(version)

program.addCommand(packages)
program.addCommand(wait)
program.addCommand(updateTestSnapshots)
program.addCommand(cat)
program.addCommand(run)
program.parse()
