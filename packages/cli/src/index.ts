#!/usr/bin/env node
import { Command } from 'commander'

import { version } from '../package.json'
import {
  BundleCommand,
  CheckCommand,
  FormatCommand,
  InitCommand,
  MockCommand,
  ServeCommand,
  ShareCommand,
  ValidateCommand,
  VoidCommand,
} from './commands'

const program = new Command()

program.name('@scalar/cli').description('CLI to work with your OpenAPI files').version(version)

/** display help in case of error */
program.showHelpAfterError()

program.addCommand(InitCommand())
program.addCommand(FormatCommand())
program.addCommand(ValidateCommand())
program.addCommand(BundleCommand())
program.addCommand(ServeCommand())
program.addCommand(MockCommand())
program.addCommand(VoidCommand())
program.addCommand(ShareCommand())
program.addCommand(CheckCommand())

/** display help if no argument has been provided */
if (process.argv.length === 2) {
  program.help()
}

program.parse()
