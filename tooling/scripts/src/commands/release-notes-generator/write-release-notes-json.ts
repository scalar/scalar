import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { compareVersions } from '@scalar/helpers/general/compare-versions'

import { type ReleaseNote, releaseNoteSchema } from './types'

type WriteJsonOptions = {
  /** Absolute or workspace-relative path to the `RELEASE_NOTES.json` file. */
  path: string
  /** Release note to insert. Replaces an existing entry with the same `version`. */
  note: ReleaseNote
}

type WriteJsonResult = {
  /** Path that was written to (echoes `options.path`). */
  path: string
  /** True when the file did not exist before this call. */
  created: boolean
  /**
   * Final list of entries written to disk, sorted newest-first. Returned
   * so the caller can hand the same array to the markdown writer in the
   * same release-notes generation run without re-reading the JSON file.
   */
  entries: ReleaseNote[]
}

/**
 * Insert (or replace) a release note in `RELEASE_NOTES.json`. The JSON
 * file is the source of truth for the in-app "What's new" modal: the
 * generator writes JSON first, the markdown file is regenerated from it,
 * and the app imports the JSON directly without any markdown parsing.
 *
 * Re-running the generator for the same version is idempotent: the
 * existing entry is overwritten in place rather than duplicated. Entries
 * are sorted newest-first by date with semver as a tiebreaker so the
 * file always reads top-down chronologically.
 */
export const writeReleaseNoteJson = async (options: WriteJsonOptions): Promise<WriteJsonResult> => {
  const existing = await readJsonIfExists(options.path)
  const created = existing === null

  const merged = mergeReleaseNotes(existing ?? [], options.note)

  await mkdir(dirname(options.path), { recursive: true })
  // Pretty-print with two-space indentation and a trailing newline so
  // diffs stay readable and the file plays nicely with text-editing tools.
  await writeFile(options.path, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8')

  return { path: options.path, created, entries: merged }
}

/**
 * Merge a new entry into the existing list. Replaces an entry with the
 * same `version` (so re-runs for the same release are idempotent), then
 * sorts newest-first by date with `version` as a tiebreaker.
 *
 * Exported for unit tests so the sorting logic does not need to touch
 * the filesystem.
 */
export const mergeReleaseNotes = (existing: readonly ReleaseNote[], next: ReleaseNote): ReleaseNote[] => {
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
 * Read and validate `RELEASE_NOTES.json` if it exists. Returns `null`
 * when the file is missing so the writer can treat the "first ever
 * release" case the same as a normal append.
 *
 * Malformed entries are skipped with a warning rather than failing the
 * release pipeline - the next valid write will still produce a clean
 * file. A completely unparseable file (invalid JSON or non-array root)
 * is treated as empty for the same reason.
 */
const readJsonIfExists = async (path: string): Promise<ReleaseNote[] | null> => {
  let raw: string
  try {
    raw = await readFile(path, 'utf-8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    console.warn(`Could not parse ${path} as JSON; treating as empty. ${(error as Error).message}`)
    return []
  }

  if (!Array.isArray(parsed)) {
    console.warn(`Expected ${path} to contain a JSON array of release notes; treating as empty.`)
    return []
  }

  const valid: ReleaseNote[] = []
  for (const candidate of parsed) {
    const result = releaseNoteSchema.safeParse(candidate)
    if (result.success) {
      valid.push(result.data)
      continue
    }
    const version =
      typeof candidate === 'object' && candidate !== null && 'version' in candidate ? String(candidate.version) : '?'
    console.warn(`Skipping malformed entry for version ${version} in ${path}: ${result.error.message}`)
  }
  return valid
}
