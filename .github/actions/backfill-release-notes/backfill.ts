import { dirname, resolve } from 'node:path'

import { buildReleaseNotesPreamble } from '../../../packages/helpers/dist/markdown/release-notes.js'
import {
  buildChangelogUrl,
  extractPullRequestNumbers,
  fetchPullRequests,
  generateReleaseNote,
  readReleaseNotesJsonFile,
  releaseNotesFileSchema,
  writeReleaseNoteJson,
  writeReleaseNotesMarkdown,
} from '../../../packages/release-notes/dist/index.js'
import type { ResolvedReleaseNotesConfig } from '../../../packages/release-notes/src/config/types'
import { findMissingReleases, readHistoricalChangelog, readHistoricalFile } from './history'

/** Backfill missing releases, preserving every checkpoint before calling the provider. */
export const backfillReleaseNotes = async (options: {
  root: string
  config: ResolvedReleaseNotesConfig
  since: string
  dryRun: boolean
  resumeRef?: string
  /** Signal that all saved entries are present before replacing the checkpoint PR. */
  onPrepared?: () => Promise<void>
}): Promise<void> => {
  const { root, config, since, dryRun, resumeRef } = options
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || new Date(since).toISOString().slice(0, 10) !== since) {
    throw new Error('BACKFILL_SINCE must be a valid YYYY-MM-DD date.')
  }
  const prepared = []
  for (const configured of config.products) {
    const product = {
      ...configured,
      outputPath: resolve(root, configured.outputPath),
      markdownPath: resolve(root, configured.markdownPath ?? configured.outputPath.replace(/\.json$/, '.md')),
    }
    const existing = await readReleaseNotesJsonFile(product.outputPath)
    // Main remains authoritative if a normal release updated a note during the backfill.
    if (resumeRef) {
      const saved = releaseNotesFileSchema.parse(
        JSON.parse(await readHistoricalFile(root, resumeRef, configured.outputPath)),
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
    if (!dryRun) {
      await writeReleaseNotesMarkdown({
        path: product.markdownPath,
        entries: await readReleaseNotesJsonFile(product.outputPath),
        preamble: buildReleaseNotesPreamble(product.displayName),
      })
    }
    prepared.push({ product, existing })
  }

  await options.onPrepared?.()
  // Restore all checkpointed products before a provider failure can interrupt generation.
  for (const { product, existing } of prepared) {
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
        path: product.markdownPath,
        entries: result.entries,
        preamble: buildReleaseNotesPreamble(product.displayName),
      })
    }
  }
}
