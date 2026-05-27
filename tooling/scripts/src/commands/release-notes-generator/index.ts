import { Command } from 'commander'

import { getChangedPathsForReleaseFiltering } from './detect-versioned-changelog-paths'
import { RELEASE_NOTES_PRODUCTS } from './products'
import { resolveUserPath } from './resolve-user-path'
import { runReleaseNotesGeneratorForProduct } from './run-release-notes-generator'
import { DEFAULT_RELEASE_NOTES_SCHEMA_PATH, writeReleaseNotesJsonSchema } from './write-release-notes-schema'

type CommandOptions = {
  all?: boolean
  package?: string
  changelog?: string
  output?: string
  markdown?: string
  schema?: string
  version?: string
  dependencyChangelog: string[]
  date?: string
  model?: string
  dryRun?: boolean
  force?: boolean
}

const runAllProducts = async (
  options: Pick<CommandOptions, 'date' | 'model' | 'dryRun' | 'force'>,
  apiKey: string,
): Promise<void> => {
  const changedPaths = options.force ? null : await getChangedPathsForReleaseFiltering()

  for (const product of RELEASE_NOTES_PRODUCTS) {
    await runReleaseNotesGeneratorForProduct({
      product,
      apiKey,
      date: options.date,
      model: options.model,
      dryRun: options.dryRun,
      changedPaths,
    })
  }

  if (!options.dryRun) {
    const schemaPath = resolveUserPath(DEFAULT_RELEASE_NOTES_SCHEMA_PATH)
    const schemaResult = await writeReleaseNotesJsonSchema({ path: schemaPath })
    console.log(`${schemaResult.changed ? 'Updated' : 'Unchanged'} ${schemaResult.path}`)
  }
}

export const releaseNotesGenerator = new Command('release-notes-generator')
  .description(
    'Generate AI-written release notes from a CHANGELOG and append them to a product RELEASE_NOTES.json (the source of truth for curated release notes). Optionally regenerates a derived RELEASE_NOTES.md alongside it. Use --all to generate notes for every registered product.',
  )
  .option('--all', 'Generate release notes for every product in the registry', false)
  .option('-p, --package <name>', 'NPM package name (for example scalar-app)')
  .option('-c, --changelog <path>', 'Path to the package CHANGELOG.md')
  .option(
    '-o, --output <path>',
    'Path to the package RELEASE_NOTES.json to update. This is the source of truth that consumers import directly.',
  )
  .option(
    '-m, --markdown <path>',
    'Optional path to a derived RELEASE_NOTES.md to regenerate from the JSON in the same run. Edits made to this file will be overwritten on the next release.',
  )
  .option(
    '-s, --schema <path>',
    `Optional path to the shared RELEASE_NOTES.schema.json. Defaults to ${DEFAULT_RELEASE_NOTES_SCHEMA_PATH}. Pass an empty string to skip schema generation.`,
  )
  .option(
    '-v, --version <semver>',
    'Version that was just released. Defaults to the version in the package.json next to --changelog.',
  )
  .option(
    '-d, --dependency-changelog <path>',
    'Path to a dependency CHANGELOG.md whose just-released section should be folded into the release note as additional context. Repeat for multiple dependencies.',
    (value: string, previous: string[] = []) => [...previous, value],
    [] as string[],
  )
  .option('--date <YYYY-MM-DD>', 'Release date (defaults to today in UTC)')
  .option('--model <id>', 'Anthropic model to use (defaults to claude-sonnet-4-5)')
  .option('--dry-run', 'Print the generated note instead of writing it', false)
  .option(
    '--force',
    'With --all, generate release notes for every registered product even when git reports no version bump',
    false,
  )
  .action(async (options: CommandOptions) => {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY is not set; skipping release-notes generation.')
      return
    }

    if (options.all) {
      await runAllProducts(options, apiKey)
      return
    }

    if (!options.package || !options.changelog || !options.output) {
      console.error('Pass --all or provide --package, --changelog, and --output.')
      process.exit(1)
    }

    const schemaPath =
      options.schema === undefined
        ? resolveUserPath(DEFAULT_RELEASE_NOTES_SCHEMA_PATH)
        : options.schema === ''
          ? null
          : resolveUserPath(options.schema)

    const registryMatch = RELEASE_NOTES_PRODUCTS.find(
      (product) => product.packageName === options.package && product.outputPath === options.output,
    )

    const product = registryMatch ?? {
      slug: options.package,
      packageName: options.package,
      displayName: options.package,
      description: 'a Scalar product',
      changelogPath: options.changelog,
      outputPath: options.output,
      markdownPath: options.markdown,
      dependencyChangelogPaths: options.dependencyChangelog ?? [],
    }

    await runReleaseNotesGeneratorForProduct({
      product,
      apiKey,
      version: options.version,
      date: options.date,
      model: options.model,
      dryRun: options.dryRun,
    })

    if (!options.dryRun && schemaPath) {
      const schemaResult = await writeReleaseNotesJsonSchema({ path: schemaPath })
      console.log(`${schemaResult.changed ? 'Updated' : 'Unchanged'} ${schemaResult.path}`)
    }
  })
