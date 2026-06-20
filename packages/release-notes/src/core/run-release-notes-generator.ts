import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { buildReleaseNotesPreamble } from '@scalar/helpers/markdown/release-notes'

import type { GithubOptions, PromptOptions, ReleaseNotesProduct, ReleaseNotesProvider } from '../config/types'
import { writeReleaseNoteJson } from '../writers/write-release-notes-json'
import { writeReleaseNotesMarkdown } from '../writers/write-release-notes-markdown'
import { shouldGenerateReleaseNotesForProduct, wasChangelogVersioned } from './detect-versioned-changelog-paths'
import { extractChangelogSection } from './extract-changelog-section'
import { extractPullRequestNumbers, fetchPullRequests } from './fetch-pull-requests'
import { type DependencyChangelog, generateReleaseNote } from './generate-release-note'
import { normalizeRelativePath, resolveUserPath } from './paths'
import { deriveMarkdownPath } from './products'

type PackageJsonInfo = {
  name: string | null
  version: string | null
}

export type RunReleaseNotesGeneratorOptions = {
  product: ReleaseNotesProduct
  provider: ReleaseNotesProvider
  version?: string
  date?: string
  model?: string
  dryRun?: boolean
  writeMarkdown?: boolean
  changedPaths?: ReadonlySet<string> | null
  github?: GithubOptions
  prompts?: PromptOptions
  fetchImpl?: typeof fetch
}

export type RunReleaseNotesGeneratorResult = {
  generated: boolean
  outputPath: string
}

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

export const buildChangelogUrl = (options: {
  repo?: string
  baseBranch?: string
  changelogPath: string
  version: string
}): string => {
  const repo = options.repo ?? 'scalar/scalar'
  const baseBranch = options.baseBranch ?? 'main'
  const repoRelativePath = normalizeRelativePath(options.changelogPath)
  const anchor = options.version.replace(/[^a-zA-Z0-9]/g, '')
  return `https://github.com/${repo}/blob/${baseBranch}/${repoRelativePath}#${anchor}`
}

export const runReleaseNotesGeneratorForProduct = async (
  options: RunReleaseNotesGeneratorOptions,
): Promise<RunReleaseNotesGeneratorResult> => {
  const { product, provider } = options
  const changedPaths = options.changedPaths ?? null
  const changelogPath = resolveUserPath(product.changelogPath)
  const outputPath = resolveUserPath(product.outputPath)
  const markdownPath = resolveUserPath(product.markdownPath ?? deriveMarkdownPath(product.outputPath))

  if (changedPaths !== null && !shouldGenerateReleaseNotesForProduct(product, changedPaths)) {
    console.warn(`Skipping ${product.slug}: no version bump in this release.`)
    return { generated: false, outputPath }
  }

  const version = options.version ?? (await readPackageJsonNextToChangelog(changelogPath)).version
  if (!version) {
    console.warn(
      `Could not determine the release version for ${product.slug}. Pass --version explicitly or ensure ${dirname(changelogPath)}/package.json has a "version" field; skipping.`,
    )
    return { generated: false, outputPath }
  }

  const changelog = await readFile(changelogPath, 'utf-8')
  const section = extractChangelogSection(changelog, version)
  const dependencyChangelogs: DependencyChangelog[] = []

  for (const path of product.dependencyChangelogPaths ?? []) {
    if (changedPaths !== null && !wasChangelogVersioned(path, changedPaths)) {
      continue
    }
    const resolved = await loadDependencyChangelog(path)
    if (resolved) {
      dependencyChangelogs.push(resolved)
    }
  }

  if (!section && dependencyChangelogs.length === 0) {
    console.warn(
      `No changelog section found for version ${version} in ${product.changelogPath} and no dependency changelog sections were found; skipping.`,
    )
    return { generated: false, outputPath }
  }

  if (!section) {
    console.warn(
      `No changelog section found for version ${version} in ${product.changelogPath}; continuing with dependency changelog context only.`,
    )
  }

  const date = options.date ?? new Date().toISOString().slice(0, 10)
  const releaseUrl = buildChangelogUrl({
    repo: options.github?.repo,
    baseBranch: options.github?.baseBranch,
    changelogPath: product.changelogPath,
    version,
  })
  const changelogSection = section ?? ''
  const dependencyChangelogText = dependencyChangelogs.map((entry) => entry.changelogSection).join('\n')
  const pullRequestNumbers = extractPullRequestNumbers(
    [changelogSection, dependencyChangelogText].filter(Boolean).join('\n'),
    options.github?.repo,
  )
  const pullRequests =
    pullRequestNumbers.length && options.github?.repo
      ? await fetchPullRequests({
          numbers: pullRequestNumbers,
          repo: options.github.repo,
          token: options.github.token,
          fetchImpl: options.fetchImpl,
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
    changelogSection,
    releaseUrl,
    provider,
    model: options.model,
    pullRequests,
    dependencyChangelogs,
    prompts: options.prompts,
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
