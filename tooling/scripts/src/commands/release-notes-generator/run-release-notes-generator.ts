import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { buildReleaseNotesPreamble } from '@scalar/helpers/markdown/release-notes'

import { extractChangelogSection } from './extract-changelog-section'
import { extractPullRequestNumbers, fetchPullRequests } from './fetch-pull-requests'
import { type DependencyChangelog, generateReleaseNote } from './generate-release-note'
import { type ReleaseNotesProduct, deriveMarkdownPath } from './products'
import { resolveUserPath } from './resolve-user-path'
import { writeReleaseNoteJson } from './write-release-notes-json'
import { writeReleaseNotesMarkdown } from './write-release-notes-markdown'

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
export const buildChangelogUrl = (changelogPath: string, version: string): string => {
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
export const readPackageJsonNextToChangelog = async (changelogPath: string): Promise<PackageJsonInfo> => {
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
export const loadDependencyChangelog = async (changelogPath: string): Promise<DependencyChangelog | null> => {
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

export type RunReleaseNotesGeneratorOptions = {
  product: ReleaseNotesProduct
  apiKey: string
  version?: string
  date?: string
  model?: string
  dryRun?: boolean
  /** When false, skip markdown regeneration (used by `--all` when JSON is unchanged). */
  writeMarkdown?: boolean
}

export type RunReleaseNotesGeneratorResult = {
  /** True when a note was generated (or printed in dry-run mode). */
  generated: boolean
  /** Path to the JSON file that was written or would be written. */
  outputPath: string
}

/**
 * Generate a release note for one product and append it to that product's
 * `RELEASE_NOTES.json`. Soft-skips when no changelog section exists for
 * the resolved version.
 */
export const runReleaseNotesGeneratorForProduct = async (
  options: RunReleaseNotesGeneratorOptions,
): Promise<RunReleaseNotesGeneratorResult> => {
  const { product, apiKey } = options
  const changelogPath = resolveUserPath(product.changelogPath)
  const outputPath = resolveUserPath(product.outputPath)
  const markdownPath = resolveUserPath(product.markdownPath ?? deriveMarkdownPath(product.outputPath))

  const version = options.version ?? (await readPackageJsonNextToChangelog(changelogPath)).version
  if (!version) {
    console.error(
      `Could not determine the release version for ${product.slug}. Pass --version explicitly or ensure ${dirname(changelogPath)}/package.json has a "version" field.`,
    )
    process.exit(1)
  }

  const changelog = await readFile(changelogPath, 'utf-8')
  const section = extractChangelogSection(changelog, version)
  if (!section) {
    console.warn(`No changelog section found for version ${version} in ${product.changelogPath}; skipping.`)
    return { generated: false, outputPath }
  }

  const date = options.date ?? new Date().toISOString().slice(0, 10)
  const releaseUrl = buildChangelogUrl(product.changelogPath, version)

  const dependencyChangelogPaths = product.dependencyChangelogPaths ?? []
  const dependencyChangelogs: DependencyChangelog[] = []
  for (const path of dependencyChangelogPaths) {
    const resolved = await loadDependencyChangelog(path)
    if (resolved) {
      dependencyChangelogs.push(resolved)
    }
  }

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
  console.log(`Generating release note for ${product.packageName}@${version}${dependencySummary}...`)

  const note = await generateReleaseNote({
    packageName: product.packageName,
    version,
    date,
    changelogSection: section,
    releaseUrl,
    apiKey,
    model: options.model,
    pullRequests,
    dependencyChangelogs,
    product: {
      displayName: product.displayName,
      description: product.description,
    },
  })

  if (options.dryRun) {
    console.log('Dry run - generated release note:')
    console.log(JSON.stringify(note, null, 2))
    return { generated: true, outputPath }
  }

  const jsonResult = await writeReleaseNoteJson({ path: outputPath, note })
  console.log(`${jsonResult.created ? 'Created' : 'Updated'} ${jsonResult.path}`)

  if (options.writeMarkdown !== false) {
    const markdownResult = await writeReleaseNotesMarkdown({
      path: markdownPath,
      entries: jsonResult.entries,
      preamble: buildReleaseNotesPreamble(product.displayName),
    })
    console.log(`${markdownResult.created ? 'Created' : 'Updated'} ${markdownResult.path}`)
  }

  return { generated: true, outputPath }
}
