#!/usr/bin/env tsx
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { Command } from 'commander'

import { extractChangelogSection } from './extract-changelog-section'
import { extractPullRequestNumbers, fetchPullRequests } from './fetch-pull-requests'
import { generateReleaseNote } from './generate-release-note'
import { writeReleaseNote } from './write-release-notes'

/**
 * Resolve a user-provided path against the directory the user actually
 * ran the command from.
 *
 * `pnpm --filter <pkg> start ...` chdirs into the package directory
 * before running the script, which means `process.cwd()` is
 * `tooling/release-notes-generator`, not the repo root. pnpm exposes the
 * original directory through `INIT_CWD` for exactly this reason, so we
 * resolve relative paths against it when available and fall back to
 * `process.cwd()` otherwise.
 */
const resolveUserPath = (input: string): string => {
  return resolve(process.env.INIT_CWD ?? process.cwd(), input)
}

/**
 * Build a deep link into the package's `CHANGELOG.md` on GitHub for a
 * given version. The repo uses date-based release tags (created by the
 * `create-github-release` job in `ci.yml`) rather than per-package
 * version tags, so a `releases/tag/...` URL would 404. Linking straight
 * to the changelog section is what users actually want anyway - the
 * full list of PRs that landed in that version.
 *
 * GitHub generates anchors by lowercasing and stripping non-alphanumerics,
 * so `## 3.5.1` becomes `#351`. Changesets writes one such heading per
 * release, which keeps this stable across releases.
 */
const buildChangelogUrl = (changelogPath: string, version: string): string => {
  const repoRelativePath = changelogPath.replace(/^\.\/+/, '').replace(/\\/g, '/')
  const anchor = version.replace(/[^a-zA-Z0-9]/g, '')
  return `https://github.com/scalar/scalar/blob/main/${repoRelativePath}#${anchor}`
}

/**
 * Read the version field from `<changelog dir>/package.json`. Lets the
 * caller omit `--version` when running this script straight after
 * `pnpm changeset version` (the default flow in CI), since the bumped
 * `package.json` already has the canonical value.
 */
const detectVersionFromPackageJson = async (changelogPath: string): Promise<string | null> => {
  const packageJsonPath = resolve(dirname(changelogPath), 'package.json')
  try {
    const contents = await readFile(packageJsonPath, 'utf-8')
    const parsed = JSON.parse(contents) as { version?: unknown }
    return typeof parsed.version === 'string' ? parsed.version : null
  } catch {
    return null
  }
}

const program = new Command()

program
  .name('release-notes-generator')
  .description('Generate AI-written release notes from a CHANGELOG and append them to the package RELEASE_NOTES.md.')
  .requiredOption('-p, --package <name>', 'NPM package name (e.g. @scalar/api-client)')
  .requiredOption('-c, --changelog <path>', 'Path to the package CHANGELOG.md')
  .requiredOption('-o, --output <path>', 'Path to the package RELEASE_NOTES.md to update')
  .option(
    '-v, --version <semver>',
    'Version that was just released. Defaults to the version in the package.json next to --changelog.',
  )
  .option('--date <YYYY-MM-DD>', 'Release date (defaults to today in UTC)')
  .option('--model <id>', 'Anthropic model to use (defaults to claude-sonnet-4-5)')
  .option('--dry-run', 'Print the generated note instead of writing it', false)
  .action(async (options) => {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Soft-fail so contributors and PR builds running `pnpm changeset
      // version` locally without the secret are not blocked. CI runs with
      // the secret set and gets the full behaviour.
      console.warn('ANTHROPIC_API_KEY is not set; skipping release-notes generation.')
      return
    }

    const changelogPath = resolveUserPath(options.changelog)
    const outputPath = resolveUserPath(options.output)

    const version = options.version ?? (await detectVersionFromPackageJson(changelogPath))
    if (!version) {
      console.error(
        `Could not determine the release version. Pass --version explicitly or ensure ${dirname(changelogPath)}/package.json has a "version" field.`,
      )
      process.exit(1)
    }

    const changelog = await readFile(changelogPath, 'utf-8')
    const section = extractChangelogSection(changelog, version)
    if (!section) {
      // Not every release touches every package - if the changeset bump
      // did not write a section for this version we skip silently rather
      // than fail the build.
      console.warn(`No changelog section found for version ${version} in ${changelogPath}; skipping.`)
      return
    }

    const date = options.date ?? new Date().toISOString().slice(0, 10)
    const releaseUrl = buildChangelogUrl(options.changelog, version)

    // Pull every PR referenced from the CHANGELOG so the model gets the
    // human-written descriptions, not just the one-line commit subject.
    // Soft-fails: if the GitHub call cannot complete (no token, rate
    // limited, network blip) we just fall back to the CHANGELOG-only
    // prompt instead of failing the release pipeline.
    const pullRequestNumbers = extractPullRequestNumbers(section)
    const pullRequests = pullRequestNumbers.length
      ? await fetchPullRequests({
          numbers: pullRequestNumbers,
          token: process.env.GITHUB_TOKEN,
        })
      : new Map()
    if (pullRequestNumbers.length && pullRequests.size === 0) {
      console.warn('Could not fetch any pull request descriptions; continuing with CHANGELOG-only context.')
    }

    console.log(`Generating release note for ${options.package}@${version}...`)
    const note = await generateReleaseNote({
      version,
      date,
      changelogSection: section,
      releaseUrl,
      apiKey,
      model: options.model,
      pullRequests,
    })

    if (options.dryRun) {
      console.log('Dry run - generated release note:')
      console.log(JSON.stringify(note, null, 2))
      return
    }

    const result = await writeReleaseNote({ path: outputPath, note })
    console.log(`${result.created ? 'Created' : 'Updated'} ${result.path}`)
  })

program.parseAsync().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
