import fs from 'node:fs/promises'
import type { UnknownObject } from '../types'
import { isObject } from './isObject'
import { normalize } from './normalize'
import { escapeJsonPointer } from './escapeJsonPointer'
import path from '../polyfills/path'

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
  return isRemoteUrl(ref) ? fetchUrl(ref) : readFile(ref)
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
 * Resolves a reference path by combining a base path with a relative path.
 * Handles both remote URLs and local file paths.
 *
 * @param base - The base path (can be a URL or local file path)
 * @param relativePath - The relative path to resolve against the base
 * @returns The resolved absolute path
 * @example
 * // Resolve remote URL
 * resolveReferencePath('https://example.com/api/schema.json', 'user.json')
 * // Returns: 'https://example.com/api/user.json'
 *
 * // Resolve local path
 * resolveReferencePath('/path/to/schema.json', 'user.json')
 * // Returns: '/path/to/user.json'
 */
function resolveReferencePath(base: string, relativePath: string) {
  if (isRemoteUrl(relativePath)) {
    return relativePath
  }

  if (isRemoteUrl(base)) {
    const url = new URL(base)

    const mergedPath = path.join(path.dirname(url.pathname), relativePath)
    return new URL(mergedPath, base).toString()
  }

  return path.join(path.dirname(base), relativePath)
}

/**
 * Prefixes an internal JSON reference with a given path prefix.
 * Takes a local reference (starting with #) and prepends the provided prefix segments.
 *
 * @param input - The internal reference string to prefix (must start with #)
 * @param prefix - Array of path segments to prepend to the reference
 * @returns The prefixed reference string
 * @throws Error if input is not a local reference
 * @example
 * prefixInternalRef('#/components/schemas/User', ['definitions'])
 * // Returns: '#/definitions/components/schemas/User'
 */
export function prefixInternalRef(input: string, prefix: string[]) {
  if (!isLocalRef(input)) {
    throw 'Please provide an internal ref'
  }

  return `#/${prefix.map(escapeJsonPointer).join('/')}${input.substring(1)}`
}

/**
 * Updates internal references in an object by adding a prefix to their paths.
 * Recursively traverses the input object and modifies any local $ref references
 * by prepending the given prefix to their paths. This is used when embedding external
 * documents to maintain correct reference paths relative to the main document.
 *
 * @param input - The object to update references in
 * @param prefix - Array of path segments to prepend to internal reference paths
 * @returns void
 * @example
 * ```ts
 * const input = {
 *   foo: {
 *     $ref: '#/components/schemas/User'
 *   }
 * }
 * updateInternalReferences(input, ['definitions'])
 * // Result:
 * // {
 * //   foo: {
 * //     $ref: '#/definitions/components/schemas/User'
 * //   }
 * // }
 * ```
 */
export function updateInternalReferences(input: unknown, prefix: string[]) {
  if (!isObject(input)) {
    return
  }

  Object.values(input).forEach((el) => updateInternalReferences(el, prefix))

  if (typeof input === 'object' && '$ref' in input && typeof input['$ref'] === 'string') {
    const ref = input['$ref']

    if (!isLocalRef(ref)) {
      return
    }

    return (input['$ref'] = prefixInternalRef(ref, prefix))
  }
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

  const EXTERNAL_KEY = 'x-external'

  // Save all external files
  input[EXTERNAL_KEY] = {}

  const bundler = async (root: any, targetKey: string = null, origin: string = '') => {
    if (!root || !isObject(root)) {
      return
    }

    await Promise.all(
      Object.entries(root).map(async ([key, value]) => {
        if (!isObject(value)) {
          return
        }

        if (key === EXTERNAL_KEY) {
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

          if (isLocalRef(ref)) {
            return
          }

          const [prefix, path = ''] = ref.split('#', 2)

          // Combine the current origin with the new path to resolve relative references
          // correctly within the context of the external file being processed
          const resolvedPath = resolveReferencePath(origin, prefix)

          if (!cache.has(resolvedPath)) {
            cache.set(resolvedPath, resolveRef(resolvedPath))
          }

          // Resolve the remote document
          const result = await cache.get(resolvedPath)

          if (result.ok) {
            // Update all internal refs within the resolved document to use the correct base path.
            // This is necessary because when we embed external documents, their internal references
            // need to be updated to maintain the correct path context relative to the main document.
            // Without this update, internal references would break when the document is embedded.
            updateInternalReferences(result.data, [EXTERNAL_KEY, resolvedPath])

            // Store the external document in the main document's x-external key
            input[EXTERNAL_KEY][escapeJsonPointer(resolvedPath)] = result.data

            // Update the ref to point to the embed document
            value.$ref = prefixInternalRef(`#${path}`, [EXTERNAL_KEY, resolvedPath])

            // After resolving an external reference and replacing the $ref with its content,
            // we need to run the bundler again specifically on this key to handle any nested
            // references that might exist within the resolved content. This targeted approach
            // prevents unnecessary traversal of unrelated parts of the object tree.
            return bundler(result.data, null, resolvedPath)
          }

          console.warn(
            `Failed to resolve external reference "${prefix}". The reference may be invalid or inaccessible.`,
          )
        }

        await bundler(root[key], null, origin)
      }),
    )
  }

  return bundler(input)
}
