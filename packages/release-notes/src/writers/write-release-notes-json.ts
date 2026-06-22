import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { compareVersions } from '@scalar/helpers/general/compare-versions'

import { type ReleaseNote, releaseNoteSchema } from '../types'

const parseReleaseNoteEntries = (parsed: readonly unknown[], pathForLogs: string): ReleaseNote[] => {
  const valid: ReleaseNote[] = []
  for (const candidate of parsed) {
    const result = releaseNoteSchema.safeParse(candidate)
    if (result.success) {
      valid.push(result.data)
      continue
    }
    const version =
      typeof candidate === 'object' && candidate !== null && 'version' in candidate ? String(candidate.version) : '?'
    console.warn(`Skipping malformed entry for version ${version} in ${pathForLogs}: ${result.error.message}`)
  }
  return valid
}

export const readReleaseNotesJsonFile = async (path: string): Promise<ReleaseNote[]> => {
  let raw: string
  try {
    raw = await readFile(path, 'utf-8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Release notes JSON not found: ${path}`)
    }
    throw error
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error(`Could not parse ${path} as JSON: ${(error as Error).message}`)
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Expected ${path} to contain a JSON array of release notes.`)
  }

  const valid = parseReleaseNoteEntries(parsed, path)
  if (parsed.length > 0 && valid.length === 0) {
    throw new Error(
      `No valid release note entries in ${path} (all ${String(parsed.length)} entries failed validation).`,
    )
  }
  return valid
}

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
  path: string
  note: ReleaseNote
}

type WriteJsonResult = {
  path: string
  created: boolean
  entries: ReleaseNote[]
}

export const writeReleaseNoteJson = async (options: WriteJsonOptions): Promise<WriteJsonResult> => {
  const existing = await readJsonIfExists(options.path)
  const created = existing === null
  const merged = mergeReleaseNotes(existing ?? [], options.note)

  await mkdir(dirname(options.path), { recursive: true })
  await writeFile(options.path, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8')

  return { path: options.path, created, entries: merged }
}

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

  return parseReleaseNoteEntries(parsed, path)
}
