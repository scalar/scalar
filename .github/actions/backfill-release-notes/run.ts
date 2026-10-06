import { dirname } from 'node:path'

import { buildReleaseNotesPreamble } from '../../../packages/helpers/dist/markdown/release-notes.js'
import {
  buildChangelogUrl,
  extractPullRequestNumbers,
  fetchPullRequests,
  generateReleaseNote,
  hasBuiltInProviderApiKey,
  readReleaseNotesConfig,
  readReleaseNotesJsonFile,
  releaseNotesFileSchema,
  writeReleaseNoteJson,
  writeReleaseNotesMarkdown,
} from '../../../packages/release-notes/dist/index.js'
import { findMissingReleases, readHistoricalChangelog, readHistoricalFile } from './history'

const root = process.cwd()
const since = process.env.BACKFILL_SINCE ?? '2026-06-01'
const dryRun = process.env.BACKFILL_DRY_RUN === 'true'
if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || new Date(since).toISOString().slice(0, 10) !== since) {
  throw new Error('BACKFILL_SINCE must be a valid YYYY-MM-DD date.')
}
const config = await readReleaseNotesConfig({})
if (!dryRun && config.builtInProviderName && !hasBuiltInProviderApiKey(config.builtInProviderName, config.apiKeyEnv)) {
  throw new Error('The release-notes provider API key is missing.')
}

for (const product of config.products) {
  const existing = await readReleaseNotesJsonFile(product.outputPath)
  // Main remains authoritative if a normal release updated a note during the backfill.
  const resumeRef = process.env.BACKFILL_RESUME_REF
  if (resumeRef) {
    const saved = releaseNotesFileSchema.parse(
      JSON.parse(await readHistoricalFile(root, resumeRef, product.outputPath)),
    )
    const versions = new Set(existing.map((note) => note.version))
    for (const note of saved) {
      if (!versions.has(note.version)) {
        existing.push(note)
        versions.add(note.version)
        if (!dryRun) {
          await writeReleaseNoteJson({ path: product.outputPath, note })
        }
      }
    }
  }
  const releases = await findMissingReleases(
    root,
    product.changelogPath,
    new Set(existing.map((note) => note.version)),
    since,
  )
  console.log(`${product.slug}: ${releases.length} missing releases since ${since}`)
  for (const release of releases) {
    console.log(`${product.slug}@${release.version} (${release.date}, ${release.commit})`)
    const primary = await readHistoricalChangelog(root, release.commit, product.changelogPath)
    if (!primary) {
      throw new Error(`No version bump for ${product.slug}@${release.version}`)
    }
    const dependencyChangelogs = []
    for (const path of product.dependencyChangelogPaths ?? []) {
      const dependency = await readHistoricalChangelog(root, release.commit, path)
      if (dependency) {
        const manifest: { name: string } = JSON.parse(
          await readHistoricalFile(root, release.commit, `${dirname(path)}/package.json`),
        )
        dependencyChangelogs.push({ packageName: manifest.name, ...dependency })
      }
    }
    if (!primary.changelogSection && dependencyChangelogs.length === 0) {
      console.log('No product or dependency changes to summarize; skipping.')
      continue
    }
    if (dryRun) {
      continue
    }
    const pullRequestNumbers = extractPullRequestNumbers(
      [primary.changelogSection, ...dependencyChangelogs.map((dependency) => dependency.changelogSection)].join('\n'),
      config.github.repo,
    )
    const pullRequests =
      config.github.repo && config.github.pullRequestContext !== false
        ? await fetchPullRequests({
            numbers: pullRequestNumbers,
            repo: config.github.repo,
            token: process.env.GITHUB_TOKEN,
          })
        : new Map()
    const note = await generateReleaseNote({
      packageName: product.packageName,
      version: release.version,
      date: release.date,
      changelogSection: primary.changelogSection,
      dependencyChangelogs,
      pullRequests,
      provider: config.provider,
      model: config.model,
      prompts: config.prompts,
      product: { displayName: product.displayName, description: product.description },
      releaseUrl: buildChangelogUrl({
        repo: config.github.repo,
        baseBranch: config.github.baseBranch,
        changelogPath: product.changelogPath,
        version: release.version,
      }),
    })
    const result = await writeReleaseNoteJson({ path: product.outputPath, note })
    // Persist each successful note so a failed provider call can be resumed from the PR.
    await writeReleaseNotesMarkdown({
      path: product.markdownPath ?? product.outputPath.replace(/\.json$/, '.md'),
      entries: result.entries,
      preamble: buildReleaseNotesPreamble(product.displayName),
    })
  }
  if (!dryRun) {
    await writeReleaseNotesMarkdown({
      path: product.markdownPath ?? product.outputPath.replace(/\.json$/, '.md'),
      entries: await readReleaseNotesJsonFile(product.outputPath),
      preamble: buildReleaseNotesPreamble(product.displayName),
    })
  }
}
