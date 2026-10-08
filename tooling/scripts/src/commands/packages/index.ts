import { Command } from 'commander'

import { outdated, update } from '@/commands/packages/catalog'

import format from './format'

export const packages = new Command('packages')
  .description('Actions for dealing with package.json files and workspace dependencies')
  .addCommand(format)
  .addCommand(outdated)
  .addCommand(update)
