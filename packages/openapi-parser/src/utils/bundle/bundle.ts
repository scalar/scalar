import type { UnknownObject } from '@/types'
import { escapeJsonPointer } from '@/utils/escape-json-pointer'
import path from '@/polyfills/path'
import { getSegmentsFromPath } from '@/utils/get-segments-from-path'
import { isObject } from '@/utils/is-object'
import { isYaml } from '@/utils/is-yaml'
import { isJson } from '@/utils/is-json'
import { getHash, uniqueValueGeneratorFactory } from '@/utils/bundle/value-generator'

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
export function isRemoteUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Checks if a string represents a file path by ensuring it's not a remote URL,
 * YAML content, or JSON content.
 *
 * @param value - The string to check
 * @returns true if the string appears to be a file path, false otherwise
 * @example
 * ```ts
 * isFilePath('./schemas/user.json') // true
 * isFilePath('https://example.com/schema.json') // false
 * isFilePath('{"type": "object"}') // false
 * isFilePath('type: object') // false
 * ```
 */
export function isFilePath(value: string) {
  return !isRemoteUrl(value) && !isYaml(value) && !isJson(value)
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
 * ⚠️ Warning: Be careful with object keys that look like numbers (e.g. "123") as this function
 * will interpret them as array indices and create arrays instead of objects. If you need to
 * use numeric-looking keys, consider prefixing them with a non-numeric character.
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
 *
 * @example
 * // ⚠️ Warning: This will create an array instead of an object with key "123"
 * setValueAtPath(obj, '/foo/123/bar', 'value')
 * // Result:
 * // {
 * //   foo: [
 * //     undefined,
 * //     undefined,
 * //     undefined,
 * //     { bar: 'value' }
 * //   ]
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

/**
 * Configuration options for the bundler.
 * Controls how external references are resolved and processed during bundling.
 */
type Config = {
  /**
   * Array of plugins that handle resolving references from different sources.
   * Each plugin is responsible for fetching and processing data from specific sources
   * like URLs or the filesystem.
   */
  plugins: Plugin[]

  /**
   * Optional root object that serves as the base document when bundling a subpart.
   * This allows resolving references relative to the root document's location,
   * ensuring proper path resolution for nested references.
   */
  root?: UnknownObject

  /**
   * Optional cache to store promises of resolved references.
   * Helps avoid duplicate fetches/reads of the same resource by storing
   * the resolution promises for reuse.
   */
  cache?: Map<string, Promise<ResolveResult>>

  /**
   * Cache of visited nodes during partial bundling.
   * Used to prevent re-bundling the same tree multiple times when doing partial bundling,
   * improving performance by avoiding redundant processing of already bundled sections.
   */
  visitedNodes?: Set<unknown>

  /**
   * Enable tree shaking to optimize the bundle size.
   * When enabled, only the parts of external documents that are actually referenced
   * will be included in the final bundle.
   */
  treeShake: boolean

  /**
   * Optional flag to generate a URL map.
   * When enabled, tracks the original source URLs of bundled references
   * in an x-ext-urls section for reference mapping.
   */
  urlMap?: boolean

  /**
   * Optional function to compress input URLs or file paths before bundling.
   * Returns either a Promise resolving to the compressed string or the compressed string directly.
   */
  compress?: (value: string) => Promise<string> | string

  /**
   * Optional hooks to monitor the bundler's lifecycle.
   * Allows tracking the progress and status of reference resolution.
   */
  hooks?: Partial<{
    /** Called when starting to resolve a reference */
    onResolveStart: (node: Record<string, unknown> & Record<'$ref', unknown>) => void
    /** Called when a reference resolution fails */
    onResolveError: (node: Record<string, unknown> & Record<'$ref', unknown>) => void
    /** Called when a reference is successfully resolved */
    onResolveSuccess: (node: Record<string, unknown> & Record<'$ref', unknown>) => void
  }>
}

/**
 * Extension keys used for bundling external references in OpenAPI documents.
 * These custom extensions help maintain the structure and traceability of bundled documents.
 */
const extensions = {
  /**
   * Custom OpenAPI extension key used to store external references.
   * This key will contain all bundled external documents.
   * The x-ext key is used to maintain a clean separation between the main
   * OpenAPI document and its bundled external references.
   */
  externalDocuments: 'x-ext',

  /**
   * Custom OpenAPI extension key used to maintain a mapping between
   * hashed keys and their original URLs in x-ext.
   * This mapping is essential for tracking the source of bundled references
   */
  externalDocumentsMappings: 'x-ext-urls',
} as const

/**
 * Bundles an OpenAPI specification by resolving all external references.
 * This function traverses the input object recursively and embeds external $ref
 * references into an x-ext section. External references can be URLs or local files.
 * The original $refs are updated to point to their embedded content in the x-ext section.
 * If the input is an object, it will be modified in place by adding an x-ext
 * property to store resolved external references.
 *
 * @param input - The OpenAPI specification to bundle. Can be either an object or string.
 *                If a string is provided, it will be resolved using the provided plugins.
 *                If no plugin can process the input, the onReferenceError hook will be invoked
 *                and an error will be emitted to the console.
 * @param config - Configuration object containing plugins and options for bundling OpenAPI specifications
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
 * const bundled = await bundle(spec, {
 *   plugins: [fetchUrls()],
 *   treeShake: true,
 *   urlMap: true,
 *   hooks: {
 *     onResolveStart: (ref) => console.log('Resolving:', ref.$ref),
 *     onResolveSuccess: (ref) => console.log('Resolved:', ref.$ref),
 *     onResolveError: (ref) => console.log('Failed to resolve:', ref.$ref)
 *   }
 * })
 * // Result:
 * // {
 * //   paths: {
 * //     '/users': {
 * //       $ref: '#/x-ext/abc123'
 * //     }
 * //   },
 * //   'x-ext': {
 * //     'abc123': {
 * //       // Resolved content from users.yaml
 * //     }
 * //   },
 * //   'x-ext-urls': {
 * //     'https://example.com/schemas/users.yaml': 'abc123'
 * //   }
 * // }
 *
 * // Example with URL input
 * const bundledFromUrl = await bundle('https://example.com/openapi.yaml', {
 *   plugins: [fetchUrls()],
 *   treeShake: true,
 *   urlMap: true,
 *   hooks: {
 *     onResolveStart: (ref) => console.log('Resolving:', ref.$ref),
 *     onResolveSuccess: (ref) => console.log('Resolved:', ref.$ref),
 *     onResolveError: (ref) => console.log('Failed to resolve:', ref.$ref)
 *   }
 * })
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

    if (result.ok && typeof result.data === 'object') {
      return result.data
    }

    throw new Error(
      'Failed to resolve input: Please provide a valid string value or pass a loader to process the input',
    )
  }

  // Resolve the input specification, which could be either a direct object or a string URL/path
  const rawSpecification = await resolveInput()

  // Document root used to write all external documents
  // We need this when we want to do a partial bundle of a document
  const documentRoot = config.root ?? rawSpecification

  // Indicates whether we're performing a partial bundle operation, which occurs when
  // a root document is provided that differs from the raw specification being bundled
  const isPartialBundling = config.root !== undefined && config.root !== rawSpecification

  // Set of nodes that have already been processed during bundling to prevent duplicate processing
  const processedNodes = config.visitedNodes ?? new Set()

  // Determines the initial origin path for the bundler based on the input type.
  // For string inputs that are URLs or file paths, uses the input as the origin.
  // For non-string inputs or other string types, returns an empty string.
  const defaultOrigin = () => {
    if (typeof input !== 'string') {
      return ''
    }

    if (isRemoteUrl(input) || isFilePath(input)) {
      return input
    }

    return ''
  }

  // Create the cache to store the compressed values to their map values
  if (documentRoot[extensions.externalDocumentsMappings] === undefined) {
    documentRoot[extensions.externalDocumentsMappings] = {}
  }
  const { generate } = uniqueValueGeneratorFactory(
    config.compress ?? getHash,
    documentRoot[extensions.externalDocumentsMappings],
  )

  const bundler = async (root: unknown, origin: string = defaultOrigin(), isChunkParent = false) => {
    if (!isObject(root) && !Array.isArray(root)) {
      return
    }

    // Skip if this node has already been processed to prevent infinite recursion
    // and duplicate processing of the same node
    if (processedNodes.has(root)) {
      return
    }
    // Mark this node as processed before continuing
    processedNodes.add(root)

    if (typeof root === 'object' && '$ref' in root && typeof root['$ref'] === 'string') {
      const ref = root['$ref']
      const isChunk = '$global' in root && typeof root['$global'] === 'boolean' && root['$global']

      if (isLocalRef(ref)) {
        if (isPartialBundling) {
          // When doing partial bundling, we need to recursively bundle all dependencies
          // referenced by this local reference to ensure the partial bundle is complete.
          // This includes not just the direct reference but also all its dependencies,
          // creating a complete and self-contained partial bundle.
          await bundler(getNestedValue(documentRoot, getSegmentsFromPath(ref.substring(1))), origin, isChunkParent)
        }
        return
      }

      const [prefix, path = ''] = ref.split('#', 2)

      // Combine the current origin with the new path to resolve relative references
      // correctly within the context of the external file being processed
      const resolvedPath = resolveReferencePath(origin, prefix)

      // Generate a unique compressed path for the external document
      // This is used as a key to store and reference the bundled external document
      // The compression helps reduce the overall file size of the bundled document
      const compressedPath = await generate(resolvedPath)

      const seen = cache.has(resolvedPath)

      if (!seen) {
        cache.set(resolvedPath, resolveContents(resolvedPath, config.plugins))
      }

      config?.hooks?.onResolveStart?.(root)

      // Resolve the remote document
      const result = await cache.get(resolvedPath)

      if (result.ok) {
        // Process the result only once to avoid duplicate processing and prevent multiple prefixing
        // of internal references, which would corrupt the reference paths
        if (!seen) {
          // Skip prefixing for chunks since they are meant to be self-contained and their
          // internal references should remain relative to their original location. Chunks
          // are typically used for modular components that need to maintain their own
          // reference context without being affected by the main document's structure.
          if (!isChunk) {
            // Update internal references in the resolved document to use the correct base path.
            // When we embed external documents, their internal references need to be updated to
            // maintain the correct path context relative to the main document. This is crucial
            // because internal references in the external document are relative to its original
            // location, but when embedded, they need to be relative to their new location in
            // the main document's x-ext section. Without this update, internal references
            // would point to incorrect locations and break the document structure.
            prefixInternalRefRecursive(result.data, [extensions.externalDocuments, compressedPath])
          }

          // Recursively process the resolved content
          // to handle any nested references it may contain. We pass the resolvedPath as the new origin
          // to ensure any relative references within this content are resolved correctly relative to
          // their new location in the bundled document.
          await bundler(result.data, isChunk ? origin : resolvedPath, isChunk)

          // Store the mapping between hashed keys and original URLs in x-ext-urls
          // This allows tracking which external URLs were bundled and their corresponding locations
          setValueAtPath(
            documentRoot,
            `/${extensions.externalDocumentsMappings}/${escapeJsonPointer(compressedPath)}`,
            resolvedPath,
          )
        }

        if (config.treeShake === true) {
          // Store only the subtree that is actually used
          // This optimizes the bundle size by only including the parts of the external document
          // that are referenced, rather than the entire document
          resolveAndCopyReferences(
            documentRoot,
            { [extensions.externalDocuments]: { [compressedPath]: result.data } },
            prefixInternalRef(`#${path}`, [extensions.externalDocuments, compressedPath]).substring(1),
            extensions.externalDocuments,
            compressedPath,
          )
        } else if (!seen) {
          // Store the external document in the main document's x-ext key
          // When tree shaking is disabled, we include the entire external document
          // This preserves all content and is faster since we don't need to analyze and copy
          // specific parts. This approach is ideal when storing the result in memory
          // as it avoids the overhead of tree shaking operations
          setValueAtPath(documentRoot, `/${extensions.externalDocuments}/${compressedPath}`, result.data)
        }

        // Update the $ref to point to the embedded document in x-ext
        // This is necessary because we need to maintain the correct path context
        // for the embedded document while preserving its internal structure
        root.$ref = prefixInternalRef(`#${path}`, [extensions.externalDocuments, compressedPath])
        config?.hooks?.onResolveSuccess?.(root)
        return
      }

      config?.hooks?.onResolveError?.(root)
      return console.warn(
        `Failed to resolve external reference "${resolvedPath}". The reference may be invalid, inaccessible, or missing a loader for this type of reference.`,
      )
    }

    // Recursively process all child objects to handle nested references
    // This ensures we catch and resolve any $refs that exist deeper in the object tree
    // We skip EXTERNAL_KEY to avoid processing already bundled content
    await Promise.all(
      Object.entries(root).map(async ([key, value]) => {
        if (key === extensions.externalDocuments) {
          return
        }

        await bundler(value, origin, isChunkParent)
      }),
    )
  }

  await bundler(rawSpecification)

  // Keep urlMappings when doing partial bundling to track hash values and handle collisions
  // For full bundling without urlMap config, remove the mappings to clean up the output
  if (!config.urlMap && !isPartialBundling) {
    // Remove the external document mappings from the output when doing a full bundle without urlMap config
    delete documentRoot[extensions.externalDocumentsMappings]
  }

  return rawSpecification
}
