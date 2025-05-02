import { Command } from 'commander'
import format from './format'
import { outdated, update } from '@/commands/packages/catalog'

export const packages = new Command('packages')
  .description('Actions for dealing with package.json files and workspace dependencies')
  .addCommand(format)
  .addCommand(outdated)
  .addCommand(update)
