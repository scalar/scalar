import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { compareVersions } from '@scalar/helpers/general/compare-versions'
import {
  DEFAULT_RELEASE_NOTES_PREAMBLE,
  type ReleaseNoteEntry,
  parseReleaseNotes,
  serializeReleaseNotes,
} from '@scalar/helpers/markdown/release-notes'

import type { ReleaseNote } from './types'

type WriteOptions = {
  /** Absolute or workspace-relative path to the `RELEASE_NOTES.md` file. */
  path: string
  /** Release note to insert. Replaces an existing entry with the same `version`. */
  note: ReleaseNote
  /**
   * Override the default preamble when creating the file for the first
   * time. Useful in tests; production callers can leave it unset.
   */
  preamble?: string
}

/**
 * Insert (or replace) a release note in `RELEASE_NOTES.md`. Re-running
 * the generator for the same version is idempotent: the existing entry
 * is overwritten in place rather than duplicated.
 *
 * Entries are sorted by date (newest first) and version as a tiebreaker
 * so the file always reads top-down chronologically, matching what the
 * "What's new" modal renders to users.
 */
export const writeReleaseNote = async (options: WriteOptions): Promise<{ path: string; created: boolean }> => {
  const existingMarkdown = await readIfExists(options.path)
  const created = existingMarkdown === null

  const existingEntries = existingMarkdown ? parseReleaseNotes(existingMarkdown) : []
  const merged = mergeReleaseNotes(existingEntries, options.note)

  const preamble = pickPreamble(existingMarkdown, options.preamble)
  const next = serializeReleaseNotes(merged, { preamble })

  await mkdir(dirname(options.path), { recursive: true })
  await writeFile(options.path, next, 'utf-8')
  return { path: options.path, created }
}

/**
 * Merge a new entry into the existing list. Replaces an entry with the
 * same `version` (so re-runs for the same release are idempotent), then
 * sorts newest-first by date with `version` as a tiebreaker.
 *
 * Exported for unit tests so the sorting logic does not need to touch
 * the filesystem.
 */
export const mergeReleaseNotes = (existing: ReleaseNoteEntry[], next: ReleaseNoteEntry): ReleaseNoteEntry[] => {
  const filtered = existing.filter((entry) => entry.version !== next.version)
  const merged = [next, ...filtered]
  merged.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1
    }
    // Semver ordering (newest version first), not lexicographic — e.g. 1.0.10 > 1.0.9.
    return compareVersions(b.version, a.version)
  })
  return merged
}

/**
 * Read a file if it exists, returning `null` instead of throwing when it
 * does not. Lets the writer treat the "first ever release" case the same
 * as a normal append.
 */
const readIfExists = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path, 'utf-8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

/**
 * Preserve the existing preamble (everything before the first version
 * heading) on round-trip so hand-written intros, comments, or links are
 * not overwritten. Falls back to the explicit `preamble` option, then to
 * the helper's default.
 */
const pickPreamble = (existingMarkdown: string | null, override: string | undefined): string => {
  if (override !== undefined) {
    return override
  }
  if (existingMarkdown === null) {
    return DEFAULT_RELEASE_NOTES_PREAMBLE
  }
  const headingIndex = existingMarkdown.search(/^##\s+\S+\s*\(\s*\d{4}-\d{2}-\d{2}\s*\)\s*$/m)
  if (headingIndex === -1) {
    // No version headings yet; the whole file is preamble.
    return existingMarkdown.trimEnd()
  }
  const preamble = existingMarkdown.slice(0, headingIndex).trimEnd()
  return preamble.length > 0 ? preamble : DEFAULT_RELEASE_NOTES_PREAMBLE
}
