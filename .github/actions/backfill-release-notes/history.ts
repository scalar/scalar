import { execFile } from 'node:child_process'
import { dirname } from 'node:path'
import { promisify } from 'node:util'

import { extractChangelogSection } from '../../../packages/release-notes/src/core/extract-changelog-section'

const execFileAsync = promisify(execFile)

/** A package release as it appeared on the main branch. */
type HistoricalRelease = {
  commit: string
  date: string
  version: string
}

const git = async (root: string, args: string[]): Promise<string> => {
  const { stdout } = await execFileAsync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })
  return stdout.trim()
}

/** Read committed content without checking out or executing historical code. */
export const readHistoricalFile = async (root: string, commit: string, path: string): Promise<string> =>
  git(root, ['show', `${commit}:${path}`])

const readVersion = async (root: string, commit: string, path: string): Promise<string | null> => {
  // Newly introduced packages do not have a manifest in the parent commit.
  const exists = await git(root, ['ls-tree', commit, '--', path])
  if (!exists) {
    return null
  }
  const parsed: unknown = JSON.parse(await readHistoricalFile(root, commit, path))
  if (typeof parsed !== 'object' || parsed === null || !('version' in parsed) || typeof parsed.version !== 'string') {
    throw new Error(`Missing version in ${commit}:${path}`)
  }
  return parsed.version
}

/** Find missing version bumps on the main branch, in release order. */
export const findMissingReleases = async (
  root: string,
  changelogPath: string,
  existingVersions: ReadonlySet<string>,
  since: string,
): Promise<HistoricalRelease[]> => {
  const manifest = `${dirname(changelogPath)}/package.json`
  // Follow main's merge commits, rather than the date a release PR was first authored.
  // Filter dates ourselves: git --since can stop walking on out-of-order commit dates.
  const history = await git(root, ['log', '--first-parent', '--reverse', '--format=%H%x09%cI', 'HEAD', '--', manifest])
  const missing: HistoricalRelease[] = []
  const seen = new Set(existingVersions)
  for (const line of history.split('\n').filter(Boolean)) {
    const [commit, timestamp] = line.split('\t')
    if (!commit || !timestamp) {
      throw new Error(`Invalid git log record: ${line}`)
    }
    const date = new Date(timestamp).toISOString().slice(0, 10)
    if (date < since) {
      continue
    }
    const version = await readVersion(root, commit, manifest)
    if (!version || seen.has(version)) {
      continue
    }
    const previousVersion = await readVersion(root, `${commit}^`, manifest)
    if (!previousVersion || previousVersion === version) {
      continue
    }
    missing.push({ commit, date, version })
    seen.add(version)
  }
  return missing
}

/** Read the changelog section and dependency versions that shipped in a release. */
export const readHistoricalChangelog = async (
  root: string,
  commit: string,
  changelogPath: string,
): Promise<{ version: string; changelogSection: string } | null> => {
  const manifest = `${dirname(changelogPath)}/package.json`
  const version = await readVersion(root, commit, manifest)
  const previousVersion = await readVersion(root, `${commit}^`, manifest)
  if (!version || version === previousVersion) {
    return null
  }
  const changelog = await readHistoricalFile(root, commit, changelogPath)
  const changelogSection = extractChangelogSection(changelog, version)
  // App releases can have an empty section when only the bundled API Client changed.
  if (!changelogSection && !changelog.split('\n').some((line) => line.trim() === `## ${version}`)) {
    throw new Error(`Missing changelog section for ${version} in ${commit}:${changelogPath}`)
  }
  return { version, changelogSection: changelogSection ?? '' }
}
