import { getValueByPath, parseJsonPointer } from '@/helpers/json-path-utils'
import fs from 'node:fs/promises'

export type UnknownObject = Record<string, unknown>

/**
 * Returns true if the value is a non-null object (but not an array).
 *
 * @example
 * ```ts
 * isObject({}) // true
 * isObject([]) // false
 * isObject(null) // false
 * ```
 */
export function isObject(value: unknown): value is UnknownObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Checks whether a json ref is a remote ref
 */
export function isRemoteRef(value: string) {
  return value.startsWith('http')
}

/**
 * Check if a json pointer is a local ref
 */
export function isLocalRef(value: string) {
  return value.startsWith('#/')
}

/**
 * Check if a json pointer is a filesystem ref
 */
export function isFileSystemRef(value: string) {
  return !isRemoteRef(value) && !isLocalRef(value)
}

/**
 * Fetches and parses JSON data from a remote URL.
 *
 * @param value - The URL to fetch data from
 * @returns A result object containing either the parsed JSON data or an error indicator
 * @example
 * ```ts
 * const result = await fetchUrl('https://api.example.com/data')
 * if (result.ok) {
 *   console.log(result.data) // The parsed JSON data
 * }
 * ```
 */
export async function fetchUrl(value: string): Promise<{ ok: true; data: unknown } | { ok: false }> {
  const response = await fetch(value)

  if (response.ok) {
    const body = await response.json()
    return { ok: true, data: body }
  }

  return { ok: false }
}

/**
 * Reads and parses a local JSON file from the filesystem.
 *
 * @param value - The file path to read from
 * @returns A result object containing either the parsed JSON data or an error indicator
 * @example
 * ```ts
 * const result = await readLocalFile('./data.json')
 * if (result.ok) {
 *   console.log(result.data) // The parsed JSON data
 * }
 * ```
 */
export async function readLocalFile(value: string): Promise<{ ok: true; data: unknown } | { ok: false }> {
  try {
    const contents = await fs.readFile(value, 'utf-8')

    return { ok: true, data: JSON.parse(contents) }
  } catch {
    return { ok: false }
  }
}

/**
 * Resolves a reference by attempting to fetch data from either a remote URL or local filesystem.
 *
 * @param value - The reference string to resolve (URL or file path)
 * @returns A result object containing either the resolved data or an error indicator
 * @example
 * ```ts
 * const result = await resolveRef('https://api.example.com/data')
 * if (result.ok) {
 *   console.log(result.data) // The resolved data
 * }
 * ```
 */
export async function resolveRef(value: string) {
  const [path, pointer] = value.split('/#')

  if (!isRemoteRef(value) && !isFileSystemRef(value)) {
    return { ok: false } as const
  }

  const result = isRemoteRef(value) ? await fetchUrl(path) : await readLocalFile(path)
  if (result.ok) {
    return {
      ok: true,
      data: getValueByPath(result.data, parseJsonPointer(pointer)),
    }
  }
  return result
}
