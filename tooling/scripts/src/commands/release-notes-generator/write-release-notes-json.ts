import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { compareVersions } from '@scalar/helpers/general/compare-versions'

import { type ReleaseNote, releaseNoteSchema } from './types'

/**
 * Total order for release notes: higher semver first (`compareVersions`);
 * when versions compare equal, newer `date` first (ISO `YYYY-MM-DD`
 * strings sort lexicographically by calendar day).
 */
const compareReleaseNoteOrder = (a: ReleaseNote, b: ReleaseNote): number => {
  const byVersion = compareVersions(b.version, a.version)
  if (byVersion !== 0) {
    return byVersion
  }
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1
  }
  return 0
}

/**
 * First index at which `next` belongs when the slice is already ordered
 * with `compareReleaseNoteOrder` (index 0 = highest version, then newest
 * date when versions tie).
 */
const lowerBoundInsertIndex = (sorted: readonly ReleaseNote[], next: ReleaseNote): number => {
  let lo = 0
  let hi = sorted.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (compareReleaseNoteOrder(sorted[mid]!, next) < 0) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  return lo
}

/**
 * Merge a new entry into the existing list. Replaces an entry with the
 * same `version` (so re-runs for the same release are idempotent), then
 * inserts `next` so the result stays ordered by **semver first** (via
 * `compareVersions`), then by **release date** when versions tie.
 *
 * **Precondition:** `existing` is already in that order (every file this
 * command writes satisfies that). Insertion is a binary search plus a
 * linear copy — no full-array sort.
 *
 * Exported for unit tests so the merge logic does not need to touch the
 * filesystem.
 */
export const mergeReleaseNotes = (existing: readonly ReleaseNote[], next: ReleaseNote): ReleaseNote[] => {
  const filtered = existing.filter((entry) => entry.version !== next.version)
  const insertAt = lowerBoundInsertIndex(filtered, next)

  const merged = new Array<ReleaseNote>(filtered.length + 1)
  for (let j = 0; j < insertAt; j += 1) {
    merged[j] = filtered[j]!
  }
  merged[insertAt] = next
  for (let j = insertAt; j < filtered.length; j += 1) {
    merged[j + 1] = filtered[j]!
  }
  return merged
}

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
   * Final list of entries written to disk: semver order (newest version
   * first via `compareVersions`), then release `date` when versions tie.
   * Returned so the caller can hand the same array to the markdown writer
   * in the same release-notes generation run without re-reading the JSON file.
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
 * are ordered by semver (newest first) with ISO `date` as a secondary key
 * when `compareVersions` ties, so the file stays stable for the markdown
 * mirror and the app.
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
 * Read and validate `RELEASE_NOTES.json` if it exists. Returns `null`
 * when the file is missing so the writer can treat the "first ever
 * release" case the same as a normal append.
 *
 * Valid entries are returned in **file order**. `mergeReleaseNotes`
 * assumes that order already matches semver-first, then date when versions
 * tie (every successful write from this module preserves that).
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
