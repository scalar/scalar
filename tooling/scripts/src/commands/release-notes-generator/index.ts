import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { Command } from 'commander'

import { extractChangelogSection } from './extract-changelog-section'
import { extractPullRequestNumbers, fetchPullRequests } from './fetch-pull-requests'
import { type DependencyChangelog, generateReleaseNote } from './generate-release-note'
import { writeReleaseNoteJson } from './write-release-notes-json'
import { writeReleaseNotesMarkdown } from './write-release-notes-markdown'

/**
 * Resolve a user-provided path against the directory the user actually
 * ran the command from.
 *
 * `pnpm --filter <pkg> start ...` chdirs into the package directory
 * before running the script, which means `process.cwd()` is
 * `tooling/scripts`, not the repo root. pnpm exposes the original
 * directory through `INIT_CWD` for exactly this reason, so we resolve
 * relative paths against it when available and fall back to
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

type PackageJsonInfo = {
  /** NPM `name` from package.json, when present. */
  name: string | null
  /** Semver `version` from package.json, when present. */
  version: string | null
}

/**
 * Read the `name` and `version` fields from `<changelog dir>/package.json`.
 * Lets the caller omit `--version` when running this script straight after
 * `pnpm changeset version` (the default flow in CI), since the bumped
 * `package.json` already has the canonical value, and lets dependency
 * CHANGELOGs auto-derive the package name for prompt labelling.
 */
const readPackageJsonNextToChangelog = async (changelogPath: string): Promise<PackageJsonInfo> => {
  const packageJsonPath = resolve(dirname(changelogPath), 'package.json')
  try {
    const contents = await readFile(packageJsonPath, 'utf-8')
    const parsed = JSON.parse(contents) as { name?: unknown; version?: unknown }
    return {
      name: typeof parsed.name === 'string' ? parsed.name : null,
      version: typeof parsed.version === 'string' ? parsed.version : null,
    }
  } catch {
    return { name: null, version: null }
  }
}

/**
 * Resolve the CHANGELOG section for a single dependency. Each dependency
 * uses its own version (from the adjacent `package.json`), since
 * Changesets bumps each package independently inside the same release.
 *
 * Returns `null` when the file or section cannot be found - missing
 * dependency CHANGELOGs degrade silently rather than failing the
 * release pipeline, matching the soft-fail philosophy used elsewhere
 * in this command.
 */
const loadDependencyChangelog = async (changelogPath: string): Promise<DependencyChangelog | null> => {
  const resolvedPath = resolveUserPath(changelogPath)
  const info = await readPackageJsonNextToChangelog(resolvedPath)

  if (!info.version) {
    console.warn(
      `Skipping dependency changelog ${changelogPath}: could not detect a version from the adjacent package.json.`,
    )
    return null
  }

  let changelog: string
  try {
    changelog = await readFile(resolvedPath, 'utf-8')
  } catch (error) {
    console.warn(`Skipping dependency changelog ${changelogPath}: ${(error as Error).message}`)
    return null
  }

  const section = extractChangelogSection(changelog, info.version)
  if (!section) {
    console.warn(
      `Skipping dependency changelog ${changelogPath}: no changelog section found for version ${info.version}.`,
    )
    return null
  }

  return {
    packageName: info.name ?? changelogPath,
    version: info.version,
    changelogSection: section,
  }
}

type CommandOptions = {
  package: string
  changelog: string
  output: string
  markdown?: string
  version?: string
  dependencyChangelog: string[]
  date?: string
  model?: string
  dryRun?: boolean
}

export const releaseNotesGenerator = new Command('release-notes-generator')
  .description(
    'Generate AI-written release notes from a CHANGELOG and append them to the package RELEASE_NOTES.json (the source of truth for the in-app "What\'s new" modal). Optionally regenerates a derived RELEASE_NOTES.md alongside it.',
  )
  .requiredOption('-p, --package <name>', 'NPM package name (e.g. scalar-app)')
  .requiredOption('-c, --changelog <path>', 'Path to the package CHANGELOG.md')
  .requiredOption(
    '-o, --output <path>',
    'Path to the package RELEASE_NOTES.json to update. This is the source of truth that the in-app "What\'s new" modal imports directly.',
  )
  .option(
    '-m, --markdown <path>',
    'Optional path to a derived RELEASE_NOTES.md to regenerate from the JSON in the same run. Edits made to this file will be overwritten on the next release.',
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
  .action(async (options: CommandOptions) => {
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
    const markdownPath = options.markdown ? resolveUserPath(options.markdown) : null

    const version = options.version ?? (await readPackageJsonNextToChangelog(changelogPath)).version
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

    // Resolve every dependency CHANGELOG up front so we can fold their PR
    // numbers into the same GitHub fetch round-trip. Each dependency uses
    // its own version derived from the package.json next to its CHANGELOG
    // because Changesets bumps each package independently in the same
    // release.
    const dependencyChangelogPaths = options.dependencyChangelog ?? []
    const dependencyChangelogs: DependencyChangelog[] = []
    for (const path of dependencyChangelogPaths) {
      const resolved = await loadDependencyChangelog(path)
      if (resolved) {
        dependencyChangelogs.push(resolved)
      }
    }

    // Pull every PR referenced from the CHANGELOG (and any dependency
    // CHANGELOGs) so the model gets the human-written descriptions, not
    // just the one-line commit subject. Soft-fails: if the GitHub call
    // cannot complete (no token, rate limited, network blip) we just
    // fall back to the CHANGELOG-only prompt instead of failing the
    // release pipeline.
    const dependencyChangelogText = dependencyChangelogs.map((entry) => entry.changelogSection).join('\n')
    const pullRequestNumbers = extractPullRequestNumbers([section, dependencyChangelogText].filter(Boolean).join('\n'))
    const pullRequests = pullRequestNumbers.length
      ? await fetchPullRequests({
          numbers: pullRequestNumbers,
          token: process.env.GITHUB_TOKEN,
        })
      : new Map()
    if (pullRequestNumbers.length && pullRequests.size === 0) {
      console.warn('Could not fetch any pull request descriptions; continuing with CHANGELOG-only context.')
    }

    const dependencySummary = dependencyChangelogs.length
      ? ` (with dependency context from ${dependencyChangelogs.map((entry) => `${entry.packageName}@${entry.version}`).join(', ')})`
      : ''
    console.log(`Generating release note for ${options.package}@${version}${dependencySummary}...`)
    const note = await generateReleaseNote({
      packageName: options.package,
      version,
      date,
      changelogSection: section,
      releaseUrl,
      apiKey,
      model: options.model,
      pullRequests,
      dependencyChangelogs,
    })

    if (options.dryRun) {
      console.log('Dry run - generated release note:')
      console.log(JSON.stringify(note, null, 2))
      return
    }

    const jsonResult = await writeReleaseNoteJson({ path: outputPath, note })
    console.log(`${jsonResult.created ? 'Created' : 'Updated'} ${jsonResult.path}`)

    if (markdownPath) {
      // Re-emit the human-friendly view from the same merged-and-sorted
      // entries so the markdown file always matches the source-of-truth
      // JSON byte-for-byte (no double-merge, no re-sort drift).
      const markdownResult = await writeReleaseNotesMarkdown({ path: markdownPath, entries: jsonResult.entries })
      console.log(`${markdownResult.created ? 'Created' : 'Updated'} ${markdownResult.path}`)
    }
  })
