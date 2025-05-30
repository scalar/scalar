import type { UnknownObject } from '@/types'
import { escapeJsonPointer } from '@/utils/escape-json-pointer'
import path from '@/polyfills/path'
import { getSegmentsFromPath } from '@/utils/get-segments-from-path'
import { isObject } from '@/utils/is-object'

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
 * Resolves a string by finding and executing the appropriate plugin.
 * @param value - The string to resolve (URL, file path, etc)
 * @param plugins - Array of plugins that can handle different types of strings
 * @returns A promise that resolves to either the content or an error result
 * @example
 * // Using a URL plugin
 * await resolveContents('https://example.com/schema.json', [urlPlugin])
 * // Using a file plugin
 * await resolveContents('./schemas/user.json', [filePlugin])
 * // No matching plugin returns { ok: false }
 * await resolveContents('#/components/schemas/User', [urlPlugin, filePlugin])
 */
async function resolveContents(value: string, plugins: Plugin[]): Promise<ResolveResult> {
  const plugin = plugins.find((p) => p.validate(value))

  if (plugin) {
    return plugin.exec(value)
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
 * Sets a value at a specified path in an object, creating intermediate objects/arrays as needed.
 * This function traverses the object structure and creates any missing intermediate objects
 * or arrays based on the path segments. If the next segment is a numeric string, it creates
 * an array instead of an object.
 *
 * @param obj - The target object to set the value in
 * @param path - The JSON pointer path where the value should be set
 * @param value - The value to set at the specified path
 * @throws {Error} If attempting to set a value at the root path ('')
 *
 * @example
 * const obj = {}
 * setValueAtPath(obj, '/foo/bar/0', 'value')
 * // Result:
 * // {
 * //   foo: {
 * //     bar: ['value']
 * //   }
 * // }
 *
 * @example
 * const obj = { existing: { path: 'old' } }
 * setValueAtPath(obj, '/existing/path', 'new')
 * // Result:
 * // {
 * //   existing: {
 * //     path: 'new'
 * //   }
 * // }
 */
export function setValueAtPath(obj: any, path: string, value: any): void {
  if (path === '') {
    throw new Error("Cannot set value at root ('') pointer")
  }

  const parts = getSegmentsFromPath(path)

  let current = obj

  for (let i = 0; i < parts.length; i++) {
    const key = parts[i]
    const isLast = i === parts.length - 1

    const nextKey = parts[i + 1]
    const shouldBeArray = /^\d+$/.test(nextKey ?? '')

    if (isLast) {
      current[key] = value
    } else {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = shouldBeArray ? [] : {}
      }
      current = current[key]
    }
  }
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
 * Resolves and copies referenced values from a source document to a target document.
 * This function traverses the document and copies referenced values to the target document,
 * while tracking processed references to avoid duplicates. It only processes references
 * that belong to the same external document.
 *
 * @param targetDocument - The document to copy referenced values to
 * @param sourceDocument - The source document containing the references
 * @param referencePath - The JSON pointer path to the reference
 * @param externalRefsKey - The key used for external references (e.g. 'x-ext')
 * @param documentKey - The key identifying the external document
 * @param processedNodes - Set of already processed nodes to prevent duplicates
 * @example
 * ```ts
 * const source = {
 *   components: {
 *     schemas: {
 *       User: {
 *         $ref: '#/x-ext/users~1schema/definitions/Person'
 *       }
 *     }
 *   }
 * }
 *
 * const target = {}
 * resolveAndCopyReferences(
 *   target,
 *   source,
 *   '/components/schemas/User',
 *   'x-ext',
 *   'users/schema'
 * )
 * // Result: target will contain the User schema with resolved references
 * ```
 */
const resolveAndCopyReferences = (
  targetDocument: unknown,
  sourceDocument: unknown,
  referencePath: string,
  externalRefsKey: string,
  documentKey: string,
  processedNodes = new Set(),
) => {
  const referencedValue = getNestedValue(sourceDocument, getSegmentsFromPath(referencePath))

  if (processedNodes.has(referencedValue)) {
    return
  }
  processedNodes.add(referencedValue)

  setValueAtPath(targetDocument, referencePath, referencedValue)

  // Do the same for each local ref
  const traverse = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return
    }

    if ('$ref' in node && typeof node['$ref'] === 'string') {
      // We only process references from the same external document because:
      // 1. Other documents will be handled in separate recursive branches
      // 2. The source document only contains the current document's content
      // This prevents undefined behavior and maintains proper document boundaries
      if (node['$ref'].startsWith(`#/${externalRefsKey}/${escapeJsonPointer(documentKey)}`)) {
        resolveAndCopyReferences(
          targetDocument,
          sourceDocument,
          node['$ref'].substring(1),
          documentKey,
          externalRefsKey,
          processedNodes,
        )
      }
    }

    for (const value of Object.values(node)) {
      traverse(value)
    }
  }

  traverse(referencedValue)
}

/**
 * Generates a short SHA-1 hash from a string value.
 * This function is used to create unique identifiers for external references
 * while keeping the hash length manageable. It uses the Web Crypto API to
 * generate a SHA-1 hash and returns the first 7 characters of the hex string.
 *
 * @param value - The string to hash
 * @returns A 7-character hexadecimal hash
 * @example
 * // Returns "a1b2c3d"
 * getHash("https://example.com/schema.json")
 */
export async function getHash(value: string) {
  // Convert string to ArrayBuffer
  const encoder = new TextEncoder()
  const data = encoder.encode(value)

  // Hash the data
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return hashHex.slice(0, 7)
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
  // Array of plugins that handle resolving references from different sources (URLs, files, etc.)
  plugins: Plugin[]
  // Optional root object that serves as the base document when bundling a subpart of the document
  // This allows resolving references relative to the root document's location
  root?: UnknownObject
  // Optional cache to store promises of resolved references to avoid duplicate fetches/reads
  cache?: Map<string, Promise<ResolveResult>>
  // Enable tree shaking, which removes unused references from the final bundle
  treeShake: boolean
  // Optional flag to generate a URL map that tracks the original source URLs of bundled references
  urlMap?: boolean
}

/**
 * Bundles an OpenAPI specification by resolving all external references.
 * This function traverses the input object recursively and embeds external $ref
 * references into an x-ext section. External references can be URLs or local files.
 * The original $refs are updated to point to their embedded content in the x-ext section.
 * If the input is an object, it will be modified in place by adding an x-ext
 * property to store resolved external references.
 *
 * @param input - The OpenAPI specification object or string to bundle. If a string is provided,
 *                it should be a URL or file path that points to an OpenAPI specification.
 *                The string will be resolved using the provided plugins before bundling.
 * @param config - Configuration object containing plugins for resolving references
 * @returns A promise that resolves to the bundled specification with all references embedded
 * @example
 * // Example with object input
 * const spec = {
 *   paths: {
 *     '/users': {
 *       $ref: 'https://example.com/schemas/users.yaml'
 *     }
 *   }
 * }
 *
 * const bundled = await bundle(spec, { plugins: [fetchUrls()] })
 * // Result:
 * // {
 * //   paths: {
 * //     '/users': {
 * //       $ref: '#/x-ext/https~1~1example.com~1schemas~1users.yaml'
 * //     }
 * //   },
 * //   'x-ext': {
 * //     'https~1~1example.com~1schemas~1users.yaml': {
 * //       // Resolved content from users.yaml
 * //     }
 * //   }
 * // }
 *
 * // Example with URL input
 * const bundledFromUrl = await bundle('https://example.com/openapi.yaml', { plugins: [fetchUrls()] })
 * // The function will first fetch the OpenAPI spec from the URL,
 * // then bundle all its external references into the x-ext section
 */
export async function bundle(input: UnknownObject | string, config: Config) {
  // Cache for storing promises of resolved external references (URLs and local files)
  // to avoid duplicate fetches/reads of the same resource
  const cache = config.cache ?? new Map<string, Promise<ResolveResult>>()

  /**
   * Resolves the input value by either returning it directly if it's not a string,
   * or attempting to resolve it using the provided plugins if it is a string.
   * @returns The resolved input data or throws an error if resolution fails
   */
  const resolveInput = async () => {
    if (typeof input !== 'string') {
      return input
    }
    const result = await resolveContents(input, config.plugins)

    if (result.ok) {
      return result.data
    }

    throw 'Please provide a valid string value or pass a loader to process the input'
  }

  const rawSpecification = await resolveInput()

  // Document root used to write all external documents
  // We need this when we want to do a partial bundle of a document
  const documentRoot = config.root ?? rawSpecification

  // Custom OpenAPI extension key used to store external references
  // This key will contain all bundled external documents
  const EXTERNAL_KEY = 'x-ext'

  // Custom OpenAPI extension key used to maintain a mapping between
  // original URLs and their corresponding hashed keys in x-ext
  const EXTERNAL_URL_MAPPING = 'x-ext-urls'

  const bundler = async (root: any, origin: string = typeof input === 'string' ? input : '') => {
    if (!isObject(root) && !Array.isArray(root)) {
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
      const hashPath = await getHash(resolvedPath)

      const seen = cache.has(resolvedPath)

      if (!seen) {
        cache.set(resolvedPath, resolveContents(resolvedPath, config.plugins))
      }

      // Resolve the remote document
      const result = await cache.get(resolvedPath)

      if (result.ok) {
        // Process the result only once to avoid duplicate processing and prevent multiple prefixing
        // of internal references, which would corrupt the reference paths
        if (!seen) {
          // Update internal references in the resolved document to use the correct base path.
          // When we embed external documents, their internal references need to be updated to
          // maintain the correct path context relative to the main document. This is crucial
          // because internal references in the external document are relative to its original
          // location, but when embedded, they need to be relative to their new location in
          // the main document's x-ext section. Without this update, internal references
          // would point to incorrect locations and break the document structure.
          prefixInternalRefRecursive(result.data, [EXTERNAL_KEY, hashPath])

          // Recursively process the resolved content
          // to handle any nested references it may contain. We pass the resolvedPath as the new origin
          // to ensure any relative references within this content are resolved correctly relative to
          // their new location in the bundled document.
          await bundler(result.data, resolvedPath)

          // Store the mapping between original URLs and their hashed keys in x-ext-urls
          // This allows tracking which external URLs were bundled and their corresponding locations
          if (config.urlMap) {
            setValueAtPath(documentRoot, `/${EXTERNAL_URL_MAPPING}/${escapeJsonPointer(resolvedPath)}`, hashPath)
          }
        }

        if (config.treeShake === true) {
          // Store only the subtree that is actually used
          // This optimizes the bundle size by only including the parts of the external document
          // that are referenced, rather than the entire document
          resolveAndCopyReferences(
            documentRoot,
            { [EXTERNAL_KEY]: { [hashPath]: result.data } },
            prefixInternalRef(`#${path}`, [EXTERNAL_KEY, hashPath]).substring(1),
            EXTERNAL_KEY,
            hashPath,
          )
        } else if (!seen) {
          // Store the external document in the main document's x-ext key
          // When tree shaking is disabled, we include the entire external document
          // This preserves all content and is faster since we don't need to analyze and copy
          // specific parts. This approach is ideal when storing the result in memory
          // as it avoids the overhead of tree shaking operations
          setValueAtPath(documentRoot, `/${EXTERNAL_KEY}/${hashPath}`, result.data)
        }

        // Update the $ref to point to the embedded document in x-ext
        // This is necessary because we need to maintain the correct path context
        // for the embedded document while preserving its internal structure
        root.$ref = prefixInternalRef(`#${path}`, [EXTERNAL_KEY, hashPath])
        return
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

  await bundler(rawSpecification)
  return rawSpecification
}
