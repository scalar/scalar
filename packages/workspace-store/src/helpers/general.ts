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
 * Checks if a string is a remote URL (starts with http:// or https://)
 * @param value - The URL string to check
 * @returns true if the string is a remote URL, false otherwise
 * @example
 * ```ts
 * isRemoteUrl('https://example.com/schema.json') // true
 * isRemoteUrl('http://api.example.com/schemas/user.json') // true
 * isRemoteUrl('#/components/schemas/User') // false
 * isRemoteUrl('./local-schema.json') // false
 * ```
 */
export function isRemoteUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://')
}

/**
 * Checks if a string is a local reference (starts with #)
 * @param value - The reference string to check
 * @returns true if the string is a local reference, false otherwise
 * @example
 * ```ts
 * isLocalRef('#/components/schemas/User') // true
 * isLocalRef('https://example.com/schema.json') // false
 * isLocalRef('./local-schema.json') // false
 * ```
 */
export function isLocalRef(value: string): boolean {
  return value.startsWith('#')
}

type ResolveResult = { ok: false } | { ok: true; data: unknown }

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
export async function fetchUrl(value: string): Promise<ResolveResult> {
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
export async function readLocalFile(value: string): Promise<ResolveResult> {
  try {
    const contents = await fs.readFile(value, 'utf-8')

    return { ok: true, data: JSON.parse(contents) }
  } catch {
    return { ok: false }
  }
}

/**
 * Resolves a reference by attempting to fetch data from either a remote URL or local filesystem.
 * The function automatically determines whether to use fetchUrl() for remote URLs or readLocalFile() for local paths.
 *
 * @param value - The reference string to resolve (URL or file path)
 * @returns A result object containing either the resolved data or an error indicator
 * @example
 * ```ts
 * const result = await resolveContents('https://api.example.com/data')
 * if (result.ok) {
 *   console.log(result.data) // The resolved data
 * }
 * ```
 */
export async function resolveContents(value: string): Promise<ResolveResult> {
  return isRemoteUrl(value) ? await fetchUrl(value) : await readLocalFile(value)
}
