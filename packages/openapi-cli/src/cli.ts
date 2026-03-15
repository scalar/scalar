#!/usr/bin/env node

import { Command } from 'commander'

import { registerResourceActionCommands } from './commands/resource-action-commands.js'
import { buildHelpSchema } from './commands/schema-command.js'
import { registerVerbCommands } from './commands/verb-commands.js'
import { loadSpec } from './load-spec.js'

function getSpecPathFromArgv(argv: string[]): string | null {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--spec' || argv[i] === '-s') {
      return argv[i + 1] ?? null
    }
    if (argv[i]?.startsWith('--spec=')) return argv[i]!.slice(7)
  }
  return null
}

async function main(): Promise<void> {
  const specPath = getSpecPathFromArgv(process.argv.slice(2))
  if (!specPath) {
    console.error('Error: --spec <file|url> is required')
    process.exit(1)
  }

  const spec = await loadSpec(specPath)

  const program = new Command()
  program
    .name('openapi-cli')
    .description(
      'OpenAPI-driven CLI (Stripe-style). Use get/post/put/patch/delete <path> or resource + action subcommands.',
    )
    .version('0.0.1')
    .requiredOption('-s, --spec <file|url>', 'OpenAPI spec file path or URL')
    .option('--base-url <url>', 'Base URL (overrides spec servers[0])', process.env['BASE_URL'])
    .option('--api-key <key>', 'API key (or API_KEY env)', process.env['API_KEY'])
    .option('--bearer <token>', 'Bearer token (or BEARER_TOKEN env)', process.env['BEARER_TOKEN'])
    .option('--yes, --force', 'Non-interactive: skip any confirmation prompts')
    .option('--help-json', 'Print structured help (JSON) for agent discoverability')

  const globalOptions = {
    baseUrl: process.env['BASE_URL'],
    apiKey: process.env['API_KEY'],
    bearer: process.env['BEARER_TOKEN'],
  }

  registerVerbCommands(program, globalOptions)
  registerResourceActionCommands(program, spec, globalOptions)

  program
    .command('schema')
    .description('Print structured command/flag description (JSON) for agent discoverability')
    .action(() => {
      console.log(JSON.stringify(buildHelpSchema(spec), null, 2))
    })

  if (process.argv.includes('--help-json')) {
    console.log(JSON.stringify(buildHelpSchema(spec), null, 2))
    process.exit(0)
  }

  await program.parseAsync(process.argv)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
