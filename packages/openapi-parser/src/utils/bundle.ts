import fs from 'node:fs/promises'
import type { UnknownObject } from '../types'
import { getSegmentsFromPath } from './getSegmentsFromPath'
import { isObject } from './isObject'
import { normalize } from './normalize'
import { dereference } from './dereference'

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
 * Checks if a string represents a local file path in the filesystem
 * @param value - The string to check
 * @returns true if the string is a local file path, false otherwise
 * @example
 * ```ts
 * isLocalFilePath('./schemas/user.json') // true
 * isLocalFilePath('../models/pet.json') // true
 * isLocalFilePath('/absolute/path/schema.json') // true
 * isLocalFilePath('#/components/schemas/User') // false
 * isLocalFilePath('https://example.com/schema.json') // false
 * ```
 */
export function isLocalFilePath(value: string): boolean {
  // Check if it starts with ./ or ../ or /
  return value.startsWith('./') || value.startsWith('../') || value.startsWith('/')
}

/**
 * Checks if a string represents an external reference (either a remote URL or local file path)
 * @param value - The string to check
 * @returns true if the string is an external reference (URL or file path), false otherwise
 * @example
 * ```ts
 * isUrlOrFilePath('https://example.com/schema.json') // true
 * isUrlOrFilePath('./local-schema.json') // true
 * isUrlOrFilePath('#/components/schemas/User') // false
 * ```
 */
export function isUrlOrFilePath(value: string) {
  return isRemoteUrl(value) || isLocalFilePath(value)
}

type ResolveResult = { ok: true; data: unknown } | { ok: false }

/**
 * Fetches and normalizes data from a remote URL
 * @param url - The URL to fetch data from
 * @returns A promise that resolves to either the normalized data or an error result
 * @example
 * ```ts
 * const result = await fetchUrl('https://api.example.com/data.json')
 * if (result.ok) {
 *   console.log(result.data) // The normalized data
 * } else {
 *   console.log('Failed to fetch data')
 * }
 * ```
 */
export async function fetchUrl(url: string): Promise<ResolveResult> {
  try {
    const result = await fetch(url)

    if (result.ok) {
      const body = await result.text()

      return {
        ok: true,
        data: normalize(body),
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
 * Reads and normalizes data from a local file
 * @param path - The file path to read from
 * @returns A promise that resolves to either the normalized data or an error result
 * @example
 * ```ts
 * const result = await readFile('./schemas/user.json')
 * if (result.ok) {
 *   console.log(result.data) // The normalized data
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
      data: normalize(fileContents),
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
  if (isRemoteUrl(ref)) {
    return fetchUrl(ref)
  }

  if (isLocalFilePath(ref)) {
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
    if (acc === undefined) {
      return undefined
    }
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

  const bundler = async (root: any, targetKey: string = null) => {
    if (!root || !isObject(root)) {
      return
    }

    await Promise.all(
      Object.entries(root).map(async ([key, value]) => {
        if (!isObject(value)) {
          return
        }

        // Skip processing other keys when we're targeting a specific key.
        // This optimization prevents unnecessary traversal of unrelated branches
        // when we only need to process a specific part of the object tree.
        if (targetKey !== null && targetKey !== key) {
          return
        }

        if (typeof value === 'object' && '$ref' in value && typeof value['$ref'] === 'string') {
          const ref = value['$ref']

          if (!isUrlOrFilePath(ref)) {
            return
          }

          const [prefix, path = ''] = ref.split('#', 2)

          if (!cache.has(prefix)) {
            cache.set(prefix, resolveRef(prefix))
          }

          // Resolve the remote ref
          const result = await cache.get(prefix)

          if (result.ok) {
            // Dereference the remote document to resolve any internal references before extracting the target segment.
            // This is necessary because local references within the remote document would become invalid
            // when merged into the final bundled document.
            const dereferencedResult = await dereference(result.data)
            root[key] = getNestedValue(dereferencedResult.schema, getSegmentsFromPath(path))

            // After resolving an external reference and replacing the $ref with its content,
            // we need to run the bundler again specifically on this key to handle any nested
            // references that might exist within the resolved content. This targeted approach
            // prevents unnecessary traversal of unrelated parts of the object tree.
            return bundler(root, key)
          }

          console.warn(
            `Failed to resolve external reference "${prefix}". The reference may be invalid or inaccessible.`,
          )
        }

        await bundler(root[key])
      }),
    )
  }

  return bundler(input)
}
