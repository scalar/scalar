#!/usr/bin/env node
import { Command } from 'commander'

import { version } from '../package.json'
import {
  BundleCommand,
  FormatCommand,
  InitCommand,
  MockCommand,
  ServeCommand,
  ShareCommand,
  ValidateCommand,
} from './commands'

const program = new Command()

program
  .name('@scalar/cli')
  .description('CLI to work with your OpenAPI files')
  .version(version)

/** display help in case of error */
program.showHelpAfterError()

program.addCommand(InitCommand())
program.addCommand(FormatCommand())
program.addCommand(ValidateCommand())
program.addCommand(BundleCommand())
program.addCommand(ServeCommand())
program.addCommand(MockCommand())
program.addCommand(ShareCommand())

/** display help if no argument has been provided */
if (process.argv.length === 2) {
  program.help()
}

program.parse()
