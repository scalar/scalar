import type { UnknownObject } from '../../types'
import { isObject } from '../isObject'
import { escapeJsonPointer } from '../escapeJsonPointer'
import path from '../../polyfills/path'

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

export type ResolveResult = { ok: true; data: unknown } | { ok: false }

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
async function resolveRef(ref: string, plugins: Plugin[]): Promise<ResolveResult> {
  const plugin = plugins.find((p) => p.validate(ref))

  if (plugin) {
    return plugin.exec(ref)
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
 * prefixInternalRefRecursive(input, ['definitions'])
 * // Result:
 * // {
 * //   foo: {
 * //     $ref: '#/definitions/components/schemas/User'
 * //   }
 * // }
 * ```
 */
export function prefixInternalRefRecursive(input: unknown, prefix: string[]) {
  if (!isObject(input)) {
    return
  }

  Object.values(input).forEach((el) => prefixInternalRefRecursive(el, prefix))

  if (typeof input === 'object' && '$ref' in input && typeof input['$ref'] === 'string') {
    const ref = input['$ref']

    if (!isLocalRef(ref)) {
      return
    }

    return (input['$ref'] = prefixInternalRef(ref, prefix))
  }
}

/**
 * Represents a plugin that handles resolving references from external sources.
 * Plugins are responsible for fetching and processing data from different sources
 * like URLs or the filesystem. Each plugin must implement validation to determine
 * if it can handle a specific reference, and an execution function to perform
 * the actual resolution.
 *
 * @property validate - Determines if this plugin can handle the given reference
 * @property exec - Fetches and processes the reference, returning the resolved data
 */
export type Plugin = {
  // Determines if this plugin can handle the given reference value
  validate: (value: string) => boolean
  // Fetches and processes the reference, returning the resolved data
  exec: (value: string) => Promise<ResolveResult>
}

type Config = {
  plugins: Plugin[]
}

/**
 * Bundles an OpenAPI specification by resolving all external references.
 * This function traverses the input object recursively and replaces any external $ref
 * references with their actual content. External references can be URLs or local files.
 *
 * @param input - The OpenAPI specification object to bundle
 * @returns A promise that resolves when all references have been resolved
 */
export function bundle(input: UnknownObject, config: Config) {
  // Cache for storing promises of resolved external references (URLs and local files)
  // to avoid duplicate fetches/reads of the same resource
  const cache = new Map<string, Promise<ResolveResult>>()

  // Initialize storage for external references using a custom OpenAPI extension key
  const EXTERNAL_KEY = 'x-external'
  input[EXTERNAL_KEY] = {}

  const bundler = async (root: any, origin: string = '') => {
    if (!root || !isObject(root)) {
      return
    }

    if (typeof root === 'object' && '$ref' in root && typeof root['$ref'] === 'string') {
      const ref = root['$ref']

      if (isLocalRef(ref)) {
        return
      }

      const [prefix, path = ''] = ref.split('#', 2)

      // Combine the current origin with the new path to resolve relative references
      // correctly within the context of the external file being processed
      const resolvedPath = resolveReferencePath(origin, prefix)

      if (!cache.has(resolvedPath)) {
        cache.set(resolvedPath, resolveRef(resolvedPath, config.plugins))
      }

      // Resolve the remote document
      const result = await cache.get(resolvedPath)

      if (result.ok) {
        // Update internal references in the resolved document to use the correct base path.
        // When we embed external documents, their internal references need to be updated to
        // maintain the correct path context relative to the main document. This is crucial
        // because internal references in the external document are relative to its original
        // location, but when embedded, they need to be relative to their new location in
        // the main document's x-external section. Without this update, internal references
        // would point to incorrect locations and break the document structure.
        prefixInternalRefRecursive(result.data, [EXTERNAL_KEY, resolvedPath])

        // Store the external document in the main document's x-external key, using the escaped path as the key
        // to ensure valid JSON pointer syntax and prevent issues with special characters in file paths
        input[EXTERNAL_KEY][escapeJsonPointer(resolvedPath)] = result.data

        // Update the $ref to point to the embedded document in x-external
        // This is necessary because we need to maintain the correct path context
        // for the embedded document while preserving its internal structure
        root.$ref = prefixInternalRef(`#${path}`, [EXTERNAL_KEY, resolvedPath])

        // After resolving an external reference, we need to recursively process the resolved content
        // to handle any nested references it may contain. We pass the resolvedPath as the new origin
        // to ensure any relative references within this content are resolved correctly relative to
        // their new location in the bundled document.
        return bundler(result.data, resolvedPath)
      }

      return console.warn(
        `Failed to resolve external reference "${prefix}". The reference may be invalid, inaccessible, or missing a loader for this type of reference.`,
      )
    }

    // Recursively process all child objects to handle nested references
    // This ensures we catch and resolve any $refs that exist deeper in the object tree
    // We skip EXTERNAL_KEY to avoid processing already bundled content
    await Promise.all(
      Object.entries(root).map(async ([key, value]) => {
        if (key === EXTERNAL_KEY) {
          return
        }

        await bundler(value, origin)
      }),
    )
  }

  return bundler(input)
}
