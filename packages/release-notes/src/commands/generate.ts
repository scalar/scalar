import { Command } from 'commander'

import { type CliConfigOverrides, hasBuiltInProviderApiKey, readReleaseNotesConfig } from '../config/read-config'
import type { BuiltInProviderName, ReleaseNotesConfig, ReleaseNotesProduct } from '../config/types'
import { getChangedPathsForReleaseFiltering } from '../core/detect-versioned-changelog-paths'
import { runReleaseNotesGeneratorForProduct } from '../core/run-release-notes-generator'

type CommandOptions = {
  all?: boolean
  product?: string
  package?: string
  changelog?: string
  output?: string
  markdown?: string
  version?: string
  dependencyChangelog: string[]
  date?: string
  model?: string
  dryRun?: boolean
  force?: boolean
  provider?: string
  apiKeyEnv?: string
  repo?: string
  baseBranch?: string
  config?: string
  markdownOutput: boolean
  pullRequestContext: boolean
}

const createAdHocProduct = (
  options: Pick<CommandOptions, 'package' | 'changelog' | 'output' | 'markdown' | 'dependencyChangelog'>,
  fallbackDescription: string,
): ReleaseNotesProduct => {
  if (!options.package || !options.changelog || !options.output) {
    throw new Error('Pass --all or provide --package, --changelog, and --output.')
  }

  return {
    slug: options.package,
    packageName: options.package,
    displayName: options.package,
    description: fallbackDescription,
    changelogPath: options.changelog,
    outputPath: options.output,
    markdownPath: options.markdown,
    dependencyChangelogPaths: options.dependencyChangelog ?? [],
  }
}

const resolveCliOverrides = (options: CommandOptions): CliConfigOverrides => {
  if (options.provider !== undefined && options.provider !== 'anthropic' && options.provider !== 'openai') {
    throw new Error(`Unsupported provider "${options.provider}". Use "anthropic" or "openai".`)
  }
  const provider: BuiltInProviderName | undefined = options.provider

  return {
    config: options.config,
    provider,
    model: options.model,
    apiKeyEnv: options.apiKeyEnv,
    repo: options.repo,
    baseBranch: options.baseBranch,
    pullRequestContext: options.pullRequestContext,
  }
}

export const createReleaseNotesGeneratorCommand = (baseConfig: ReleaseNotesConfig = {}): Command => {
  return new Command('release-notes-generator')
    .description(
      'Generate AI-written release notes from a CHANGELOG and append them to a product RELEASE_NOTES.json. Use --all to generate notes for every configured product.',
    )
    .option('--all', 'Generate release notes for every product in the config', false)
    .option('--product <slug>', 'Configured product slug to generate')
    .option('-p, --package <name>', 'NPM package name for ad-hoc generation')
    .option('-c, --changelog <path>', 'Path to the package CHANGELOG.md')
    .option('-o, --output <path>', 'Path to the package RELEASE_NOTES.json to update')
    .option('-m, --markdown <path>', 'Optional path to a derived RELEASE_NOTES.md')
    .option('-v, --version <semver>', 'Version that was just released')
    .option(
      '-d, --dependency-changelog <path>',
      'Dependency CHANGELOG.md whose just-released section should be folded into the release note. Repeat for multiple dependencies.',
      (value: string, previous: string[] = []) => [...previous, value],
      [],
    )
    .option('--date <YYYY-MM-DD>', 'Release date (defaults to today in UTC)')
    .option('--provider <provider>', 'AI provider to use: anthropic or openai')
    .option('--model <id>', 'AI model to use')
    .option('--api-key-env <name>', 'Environment variable that contains the selected provider API key')
    .option('--repo <owner/repo>', 'GitHub repository slug for PR context and changelog links')
    .option('--base-branch <branch>', 'Base branch for changelog links and --all git filtering')
    .option('--config <path>', 'Path to a release-notes config file')
    .option('--dry-run', 'Print the generated note instead of writing it', false)
    .option('--force', 'With --all, generate release notes for every configured product', false)
    .option('--no-markdown-output', 'Skip Markdown regeneration')
    .option('--no-pull-request-context', 'Skip fetching pull request titles and descriptions for AI context')
    .action(async (options: CommandOptions) => {
      const cliOverrides = resolveCliOverrides(options)
      const config = await readReleaseNotesConfig(cliOverrides, baseConfig)

      // When relying on a built-in provider, skip gracefully if its API key is missing.
      // This keeps `pnpm release:version --all` from failing on forks, contributor
      // machines, or CI that do not have the provider secret configured.
      //
      // The warning intentionally names only the provider, never the resolved
      // environment variable name. The env var name is harmless to log, but keeping
      // it out of the message avoids a false-positive clear-text-logging alert from
      // CodeQL, whose name-based heuristic flags anything derived from `apiKeyEnv`.
      if (config.builtInProviderName && !hasBuiltInProviderApiKey(config.builtInProviderName, config.apiKeyEnv)) {
        console.warn(
          `No API key set for the ${config.builtInProviderName} provider; skipping release-notes generation.`,
        )
        return
      }

      const products = options.all
        ? config.products
        : options.product
          ? config.products.filter((product) => product.slug === options.product)
          : [createAdHocProduct(options, config.prompts.productDescriptionFallback ?? 'an open-source package')]

      if (products.length === 0) {
        throw new Error(
          options.product ? `No configured product found for slug ${options.product}.` : 'No products configured.',
        )
      }

      const changedPaths =
        options.all && !options.force
          ? await getChangedPathsForReleaseFiltering(config.github.baseBranch ?? 'main')
          : null

      for (const product of products) {
        await runReleaseNotesGeneratorForProduct({
          product,
          provider: config.provider,
          version: options.version,
          date: options.date,
          model: config.model,
          dryRun: options.dryRun,
          changedPaths,
          writeMarkdown: options.markdownOutput,
          github: config.github,
          prompts: config.prompts,
        })
      }
    })
}

export const releaseNotesGenerator = createReleaseNotesGeneratorCommand()
