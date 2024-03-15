#!/usr/bin/env node
import { Command } from 'commander'

import { version } from '../package.json'
import {
  BundleCommand,
  FormatCommand,
  InitCommand,
  MockCommand,
  ReferenceCommand,
  ShareCommand,
  ValidateCommand,
} from './commands'

const program = new Command()

program
  .name('@scalar/cli')
  .description('CLI to work with your OpenAPI files')
  .version(version)

program.addCommand(InitCommand(), {
  isDefault: true,
})
program.addCommand(FormatCommand())
program.addCommand(ValidateCommand())
program.addCommand(BundleCommand())
program.addCommand(ReferenceCommand())
program.addCommand(MockCommand())
program.addCommand(ShareCommand())

program.parse()
