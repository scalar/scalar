import fs from 'node:fs/promises'
import type { UnknownObject } from '../types'
import { getSegmentsFromPath } from './getSegmentsFromPath'
import { isObject } from './isObject'

/**
 * Checks if a JSON pointer is a remote reference (starts with http:// or https://)
 * @param ref - The JSON pointer string to check
 * @returns true if the ref is a remote reference, false otherwise
 * @example
 * ```ts
 * isRemoteRef('https://example.com/schema.json') // true
 * isRemoteRef('http://api.example.com/schemas/user.json') // true
 * isRemoteRef('#/components/schemas/User') // false
 * isRemoteRef('./local-schema.json') // false
 * ```
 */
export function isRemoteRef(ref: string): boolean {
  return ref.startsWith('http://') || ref.startsWith('https://')
}

/**
 * Checks if a JSON reference points to a local file
 * @param ref - The JSON reference string to check
 * @returns true if the reference points to a local file, false otherwise
 * @example
 * ```ts
 * isLocalFileRef('./schemas/user.json') // true
 * isLocalFileRef('../models/pet.json') // true
 * isLocalFileRef('/absolute/path/schema.json') // true
 * isLocalFileRef('#/components/schemas/User') // false
 * isLocalFileRef('https://example.com/schema.json') // false
 * ```
 */
export function isLocalFileRef(ref: string): boolean {
  // Check if it starts with ./ or ../ or /
  return ref.startsWith('./') || ref.startsWith('../') || ref.startsWith('/')
}

/**
 * Checks if a reference is external (either remote or local file)
 * @param ref - The reference string to check
 * @returns true if the reference is external, false otherwise
 * @example
 * ```ts
 * isExternalRef('https://example.com/schema.json') // true
 * isExternalRef('./local-schema.json') // true
 * isExternalRef('#/components/schemas/User') // false
 * ```
 */
export function isExternalRef(ref: string) {
  return isRemoteRef(ref) || isLocalFileRef(ref)
}

type ResolveResult = { ok: true; data: unknown } | { ok: false }

/**
 * Fetches JSON data from a remote URL
 * @param url - The URL to fetch JSON data from
 * @returns A promise that resolves to either the JSON data or an error result
 * @example
 * ```ts
 * const result = await fetchJson('https://api.example.com/data.json')
 * if (result.ok) {
 *   console.log(result.data) // The JSON data
 * } else {
 *   console.log('Failed to fetch JSON')
 * }
 * ```
 */
export async function fetchJson(url: string): Promise<ResolveResult> {
  try {
    const result = await fetch(url)

    if (result.ok) {
      const body = await result.json()

      return {
        ok: true,
        data: body,
      }
    }

    return {
      ok: false,
    }
  } catch {
    return {
      ok: false,
    }
  }
}

/**
 * Reads and parses a JSON file from the local filesystem
 * @param path - The path to the JSON file to read
 * @returns A promise that resolves to either the parsed JSON data or an error result
 * @example
 * ```ts
 * const result = await readFile('./config.json')
 * if (result.ok) {
 *   console.log(result.data) // The parsed JSON data
 * } else {
 *   console.log('Failed to read file')
 * }
 * ```
 */
export async function readFile(path: string): Promise<ResolveResult> {
  try {
    const fileContents = await fs.readFile(path, { encoding: 'utf-8' })

    return {
      ok: true,
      data: JSON.parse(fileContents),
    }
  } catch {
    return {
      ok: false,
    }
  }
}

/**
 * Resolves a reference by fetching its content from either a remote URL or local file.
 * @param ref - The reference string to resolve
 * @returns A promise that resolves to either the content or an error result
 * @example
 * // Resolve a remote URL
 * await resolveRef('https://example.com/schema.json')
 * // Resolve a local file
 * await resolveRef('./schemas/user.json')
 * // Invalid reference returns { ok: false }
 * await resolveRef('#/components/schemas/User')
 */
async function resolveRef(ref: string): Promise<ResolveResult> {
  if (isRemoteRef(ref)) {
    return fetchJson(ref)
  }

  if (isLocalFileRef(ref)) {
    return readFile(ref)
  }

  return {
    ok: false,
  }
}

/**
 * Retrieves a nested value from an object using an array of property segments.
 * @param target - The target object to traverse
 * @param segments - Array of property names representing the path to the desired value
 * @returns The value at the specified path, or undefined if the path doesn't exist
 * @example
 * const obj = { foo: { bar: { baz: 42 } } };
 * getNestedValue(obj, ['foo', 'bar', 'baz']); // returns 42
 */
export function getNestedValue(target: Record<string, any>, segments: string[]) {
  return segments.reduce<any>((acc, key) => {
    return acc[key]
  }, target)
}

/**
 * Bundles an OpenAPI specification by resolving all external references.
 * This function traverses the input object recursively and replaces any external $ref
 * references with their actual content. External references can be URLs or local files.
 *
 * @param input - The OpenAPI specification object to bundle
 * @returns A promise that resolves when all references have been resolved
 */
export function bundle(input: UnknownObject) {
  // Cache for storing promises of resolved external references (URLs and local files)
  // to avoid duplicate fetches/reads of the same resource
  const cache = new Map<string, Promise<ResolveResult>>()

  const bundler = async (root: any) => {
    if (!root || !isObject(root)) {
      return
    }

    await Promise.all(
      Object.entries(root).map(async ([key, value]) => {
        if (!isObject(value)) {
          return
        }

        if (typeof value === 'object' && '$ref' in value && typeof value['$ref'] === 'string') {
          const ref = value['$ref']

          if (!isExternalRef(ref)) {
            return
          }

          const [prefix, path] = ref.split('/#', 2)

          if (!cache.has(prefix)) {
            cache.set(prefix, resolveRef(prefix))
          }

          // Resolve the remote ref
          const result = await cache.get(prefix)

          if (result.ok) {
            root[key] = getNestedValue(result.data as any, getSegmentsFromPath(path))
          } else {
            console.warn(
              `Failed to resolve external reference "${prefix}". The reference may be invalid or inaccessible.`,
            )
          }
        }

        await bundle(root[key])
      }),
    )
  }

  return bundler(input)
}
