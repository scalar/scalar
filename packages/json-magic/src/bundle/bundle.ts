import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { isObject } from '@scalar/helpers/object/is-object'
import { preventPollution } from '@scalar/helpers/object/prevent-pollution'

import { getId } from '@/helpers/get-schemas'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { isFilePath } from '@/helpers/is-file-path'
import { isHttpUrl } from '@/helpers/is-http-url'
import { resolveReferencePath } from '@/helpers/resolve-reference-path'
import { setValueAtPath } from '@/helpers/set-value-at-path'
import { toRelativePath } from '@/helpers/to-relative-path'
import type { UnknownObject } from '@/types'

import { escapeJsonPointer } from '../helpers/escape-json-pointer'
import { getSegmentsFromPath } from '../helpers/get-segments-from-path'
import type { ReferenceDiagnostic } from './bundle-with-diagnostics'
import { type DocumentResolver, documentReferences } from './document-references'
import { documentTraversal } from './document-traversal'
import { isReferenceContext } from './reference-context'
import { getHash, uniqueValueGeneratorFactory } from './value-generator'

/** Type guard to check if a value is an object with a $ref property */
const hasRef = (value: unknown): value is UnknownObject & Record<'$ref', string> =>
  isObject(value) && '$ref' in value && typeof value['$ref'] === 'string'

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

export type ResolveResult = { ok: true; data: unknown; raw: string } | { ok: false }

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
function resolveContents(value: string, plugins: LoaderPlugin[]): Promise<ResolveResult> {
  const plugin = plugins.find((p) => p.validate(value))

  if (plugin) {
    return plugin.exec(value)
  }

  return Promise.resolve({
    ok: false,
  })
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
  if (Array.isArray(input)) {
    input.forEach((el) => prefixInternalRefRecursive(el, prefix))
    return
  }

  if (!isObject(input)) {
    return
  }

  Object.values(input).forEach((el) => prefixInternalRefRecursive(el, prefix))

  if (typeof input === 'object' && '$ref' in input && typeof input['$ref'] === 'string') {
    const ref = input['$ref']

    if (!isLocalRef(ref)) {
      return
    }

    input['$ref'] = prefixInternalRef(ref, prefix)
  }
}

/**
 * Sets a value in the target document, creating any missing containers with the same shape
 * they have in the source document.
 *
 * We cannot let `setValueAtPath` guess here: it creates an array whenever the next segment
 * looks like a number, so copying `#/components/schemas/400` first would turn
 * `components.schemas` into a sparse array instead of a map keyed by schema name.
 */
const setValueMirroringSource = (
  targetDocument: unknown,
  sourceDocument: unknown,
  segments: string[],
  value: unknown,
): void => {
  if (segments.length === 0) {
    throw new Error("Cannot set value at root ('') pointer")
  }

  segments.forEach((segment) => preventPollution(segment))

  let target = targetDocument as Record<string, unknown>
  let source = sourceDocument as Record<string, unknown> | undefined

  for (const [index, segment] of segments.entries()) {
    if (index === segments.length - 1) {
      target[segment] = value
      return
    }

    source = isObject(source) || Array.isArray(source) ? (source[segment] as Record<string, unknown>) : undefined

    if (typeof target[segment] !== 'object' || target[segment] === null) {
      target[segment] = Array.isArray(source) ? [] : {}
    }

    target = target[segment] as Record<string, unknown>
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
 * @param bundleLocalRefs - Also bundles the local refs
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
export const resolveAndCopyReferences = (
  targetDocument: unknown,
  sourceDocument: unknown,
  referencePath: string,
  externalRefsKey: string,
  documentKey: string,
  bundleLocalRefs = false,
  processedNodes = new Set(),
  documentMetadata: Record<string, unknown> = {},
  shouldVisit: (node: object) => boolean = () => true,
  resolveReference: (node: object, reference: string) => string | undefined = (_node, reference) => reference,
  parsePath: (path: string) => string[] = getSegmentsFromPath,
) => {
  const referencedValue = getValueByPath(sourceDocument, parsePath(referencePath)).value

  if (processedNodes.has(referencedValue)) {
    return
  }
  processedNodes.add(referencedValue)

  // Only relocated copies need canonical metadata; keep the authored source unchanged.
  const segments = parsePath(referencePath)
  const copiedValue =
    segments.length === 2 && isObject(referencedValue) && Object.keys(documentMetadata).length > 0
      ? { ...referencedValue, ...documentMetadata }
      : referencedValue
  setValueMirroringSource(targetDocument, sourceDocument, segments, copiedValue)

  // Keep every enclosing base when copying a subtree, so later partial bundles
  // resolve against the same document and schema resources as the original.
  for (let length = 2; length < segments.length; length++) {
    const ancestorPath = segments.slice(0, length)
    const ancestor = getValueByPath(sourceDocument, ancestorPath).value
    if (!isObject(ancestor)) {
      continue
    }
    if (length === 2) {
      for (const [key, value] of Object.entries(documentMetadata)) {
        setValueAtPath(targetDocument, `/${[...ancestorPath, key].map(escapeJsonPointer).join('/')}`, value, parsePath)
      }
    }
    if (typeof ancestor.$id === 'string') {
      setValueAtPath(
        targetDocument,
        `/${[...ancestorPath, '$id'].map(escapeJsonPointer).join('/')}`,
        ancestor.$id,
        parsePath,
      )
    }
  }

  // Do the same for each local ref
  const traverse = (node: unknown) => {
    if (!node || typeof node !== 'object' || !shouldVisit(node)) {
      return
    }

    const reference =
      '$ref' in node && typeof node['$ref'] === 'string' ? resolveReference(node, node['$ref']) : undefined
    if (reference !== undefined) {
      // We only process references from the same external document because:
      // 1. Other documents will be handled in separate recursive branches
      // 2. The source document only contains the current document's content
      // This prevents undefined behavior and maintains proper document boundaries
      if (reference.startsWith(`#/${externalRefsKey}/${escapeJsonPointer(documentKey)}`)) {
        resolveAndCopyReferences(
          targetDocument,
          sourceDocument,
          reference.substring(1),
          externalRefsKey,
          documentKey,
          bundleLocalRefs,
          processedNodes,
          documentMetadata,
          shouldVisit,
          resolveReference,
          parsePath,
        )
      }
      // Bundle the local refs as well
      else if (bundleLocalRefs) {
        resolveAndCopyReferences(
          targetDocument,
          sourceDocument,
          reference.substring(1),
          externalRefsKey,
          documentKey,
          bundleLocalRefs,
          processedNodes,
          documentMetadata,
          shouldVisit,
          resolveReference,
          parsePath,
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
 * A loader plugin for resolving external references during bundling.
 * Loader plugins are responsible for handling specific types of external references,
 * such as files, URLs, or custom protocols. Each loader plugin must provide:
 *
 * - A `validate` function to determine if the plugin can handle a given reference string.
 * - An `exec` function to asynchronously fetch and resolve the referenced data,
 *   returning a Promise that resolves to a `ResolveResult`.
 *
 * Loader plugins enable extensible support for different reference sources in the bundler.
 *
 * @property type - The plugin type, always 'loader' for loader plugins.
 * @property validate - Function to check if the plugin can handle a given reference value.
 * @property exec - Function to fetch and resolve the reference, returning the resolved data.
 */
export type LoaderPlugin = {
  type: 'loader'
  // Returns true if this plugin can handle the given reference value
  validate: (value: string) => boolean
  // Asynchronously fetches and resolves the reference, returning the resolved data
  exec: (value: string) => Promise<ResolveResult>
}

/**
 * Context information for a node during traversal or processing.
 *
 * Note: The `path` parameter represents the path to the current node being processed.
 * If you are performing a partial bundle (i.e., providing a custom root), this path will be relative
 * to the root you provide, not the absolute root of the original document. You may need to prefix
 * it with your own base path if you want to construct a full path from the absolute document root.
 *
 * - `path`: The JSON pointer path (as an array of strings) from the document root to the current node.
 * - `resolutionCache`: A cache for storing promises of resolved references.
 * - `origin`: The origin (URL or file path) of the document this node lives in. Lifecycle plugins can
 *   use it to resolve relative references (for example an example's `externalValue`) into absolute URLs.
 */
type NodeProcessContext = {
  path: readonly string[]
  referencedFromPath?: readonly string[]
  resolutionCache: Map<string, Promise<Readonly<ResolveResult>>>
  parentNode: UnknownObject | null
  rootNode: UnknownObject
  loaders: LoaderPlugin[]
  origin: string
}

/**
 * A plugin type for lifecycle hooks, allowing custom logic to be injected into the bundler's process.
 * This type extends the Config['hooks'] interface and is identified by type: 'lifecycle'.
 */
export type LifecyclePlugin = { type: 'lifecycle' } & Config['hooks']

/**
 * Represents a plugin used by the bundler for extensibility.
 *
 * Plugins can be either:
 * - Loader plugins: Responsible for resolving and loading external references (e.g., from files, URLs, or custom sources).
 * - Lifecycle plugins: Provide lifecycle hooks to customize or extend the bundling process.
 *
 * Loader plugins must implement:
 *   - `validate`: Checks if the plugin can handle a given reference value.
 *   - `exec`: Asynchronously resolves and returns the referenced data.
 *
 * Lifecycle plugins extend the bundler's lifecycle hooks for custom logic.
 */
export type Plugin = LoaderPlugin | LifecyclePlugin

/**
 * Configuration options for the bundler.
 * Controls how external references are resolved and processed during bundling.
 */
export type Config = {
  /** Opt in to OpenAPI/AsyncAPI and JSON Schema literal-data boundaries. */
  traversal?: 'document' | 'generic'

  /**
   * Array of plugins that handle resolving references from different sources.
   * Each plugin is responsible for fetching and processing data from specific sources
   * like URLs or the filesystem.
   */
  plugins: Plugin[]

  /**
   * Return true to retain an authored $ref without resolving, loading, or rewriting it.
   * Receives the effective source base, including enclosing $id values. Sibling fields
   * are still traversed. Root loading is unaffected; resolution hooks are not called
   * for preserved edges. With this option, $id values are made absolute for relocation.
   */
  preserveReference?: (ref: string, context: { origin: string }) => boolean

  /**
   * Optional root object that serves as the base document when bundling a subpart.
   * This allows resolving references relative to the root document's location,
   * ensuring proper path resolution for nested references.
   */
  root?: UnknownObject

  /**
   * Optional maximum depth for reference resolution.
   * Limits how deeply the bundler will follow and resolve nested $ref pointers.
   * Useful for preventing infinite recursion or excessive resource usage.
   */
  depth?: number

  /**
   * Optional origin path for the bundler.
   * Used to resolve relative paths in references, especially when the input is a string URL or file path.
   * If not provided, the bundler will use the input value as the origin.
   */
  origin?: string

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
   * in an section for reference mapping defined by externalDocumentsMappingsKey.
   */
  urlMap?: boolean

  /**
   * Custom OpenAPI extension key used to store external references.
   * This key will contain all bundled external documents.
   * The key is used to maintain a clean separation between the main
   * OpenAPI document and its bundled external references.
   * @default 'x-ext'
   */
  externalDocumentsKey?: string

  /**
   * Custom OpenAPI extension key used to maintain a mapping between
   * hashed keys and their original URLs.
   * This mapping is essential for tracking the source of bundled references
   * @default 'x-ext-urls'
   */
  externalDocumentsMappingsKey?: string

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
    /** Called once a complete document is available, including cached and saved documents.
     * The first resolver returning an identity supplies its base URI and retained metadata.
     * This hook is synchronous because identities are indexed before following references.
     */
    resolveDocument: DocumentResolver
    /**
     * Optional hook called when the bundler starts resolving a $ref.
     * Useful for tracking or logging the beginning of a reference resolution.
     */
    onResolveStart: (node: UnknownObject & Record<'$ref', unknown>) => void
    /**
     * Optional hook called when the bundler fails to resolve a $ref.
     * Can be used for error handling, logging, or custom error reporting.
     */
    onResolveError: (node: UnknownObject & Record<'$ref', unknown>) => void
    /**
     * Optional hook called when the bundler successfully resolves a $ref.
     * Useful for tracking successful resolutions or custom post-processing.
     */
    onResolveSuccess: (node: UnknownObject & Record<'$ref', unknown>) => void
    /**
     * Optional hook invoked before processing a node.
     * Can be used for preprocessing, mutation, or custom logic before the node is handled by the bundler.
     */
    onBeforeNodeProcess: (node: UnknownObject, context: NodeProcessContext) => void | Promise<void>
    /**
     * Optional hook invoked after processing a node.
     * Useful for postprocessing, cleanup, or custom logic after the node has been handled by the bundler.
     */
    onAfterNodeProcess: (node: UnknownObject, context: NodeProcessContext) => void | Promise<void>
  }>
}

/**
 * Extension keys used for bundling external references in OpenAPI documents.
 * These custom extensions help maintain the structure and traceability of bundled documents.
 */
export const extensions = {
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

type HookFn<T extends keyof Config['hooks']> =
  NonNullable<Config['hooks'][T]> extends (...args: infer A) => any ? (...args: A) => any : never

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
export const bundle = (input: UnknownObject | string, config: Config): Promise<object> => bundleDocument(input, config)

/** Shared engine; diagnostics are opt-in through bundleWithDiagnostics. */
export const bundleDocument = async (
  input: UnknownObject | string,
  config: Config,
  diagnostics?: ReferenceDiagnostic[],
): Promise<object> => {
  // Set the default external documents key and mappings key if not provided in the config
  config.externalDocumentsKey = config.externalDocumentsKey ?? extensions.externalDocuments
  config.externalDocumentsMappingsKey = config.externalDocumentsMappingsKey ?? extensions.externalDocumentsMappings

  // Reject unsafe storage keys before cache indexing or loaders can mutate the document.
  preventPollution(config.externalDocumentsKey)
  preventPollution(config.externalDocumentsMappingsKey)

  // Cache for storing promises of resolved external references (URLs and local files)
  // to avoid duplicate fetches/reads of the same resource
  const cache = config.cache ?? new Map<string, Promise<ResolveResult>>()

  const loaderPlugins = config.plugins.filter((it) => it.type === 'loader')
  const lifecyclePlugin = config.plugins.filter((it) => it.type === 'lifecycle')

  /**
   * Resolves the input value by either returning it directly if it's not a string,
   * or attempting to resolve it using the provided plugins if it is a string.
   * @returns The resolved input data or throws an error if resolution fails
   */
  const resolveInput = async () => {
    if (typeof input !== 'string') {
      return input
    }
    const result = await resolveContents(input, loaderPlugins)

    if (result.ok && typeof result.data === 'object' && (!diagnostics || isObject(result.data))) {
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

  // Determines if the bundling operation is partial.
  // Partial bundling occurs when:
  // - A root document is provided that is different from the raw specification being bundled, or
  // - A maximum depth is specified in the config.
  // In these cases, only a subset of the document may be bundled.
  const isPartialBundling =
    (config.root !== undefined && config.root !== rawSpecification) || config.depth !== undefined

  // Set of nodes that have already been processed during bundling to prevent duplicate processing
  const processedNodes = config.visitedNodes ?? new Set()

  // Determines the initial origin path for the bundler based on the input type.
  // For string inputs that are URLs or file paths, uses the input as the origin.
  // For non-string inputs or other string types, returns an '/' as a root path.
  const getDefaultOrigin = () => {
    if (config.origin) {
      return config.origin
    }

    if (typeof input !== 'string') {
      return '/'
    }

    if (isHttpUrl(input) || isFilePath(input)) {
      return input
    }

    return '/'
  }

  // Registry paths are JSON pointers; only authored URI fragments need percent decoding.
  const parsePath = (pointer: string): string[] =>
    diagnostics ? pointer.split('/').slice(1).map(unescapeJsonPointerSegment) : getSegmentsFromPath(pointer)
  const setPath = (target: object, path: string, value: unknown): void => setValueAtPath(target, path, value, parsePath)
  const traversal = documentTraversal(
    config.traversal === 'document',
    documentRoot['swagger'] === '2.0',
    documentRoot['swagger'] !== '2.0' && !String(documentRoot['openapi']).startsWith('3.0.'),
  )
  traversal.register(
    documentRoot,
    getDefaultOrigin(),
    config.traversal === 'document' &&
      !('openapi' in documentRoot || 'swagger' in documentRoot || 'asyncapi' in documentRoot)
      ? 'schema'
      : 'object',
  )
  const deferredCopies: (() => void)[] = []
  const copyReferences = (...args: Parameters<typeof resolveAndCopyReferences>): void => {
    const copy = (): void =>
      resolveAndCopyReferences(
        args[0],
        args[1],
        args[2],
        args[3],
        args[4],
        args[5],
        args[6],
        args[7],
        (node) => traversal.location(node)?.context !== 'data',
        (node, ref) => {
          const context = traversal.location(node)?.context
          if (context && !isReferenceContext(context)) return undefined
          if (!diagnostics) return ref
          const target = references.resolve(ref, references.origin(node) ?? defaultOrigin)
          return target?.value !== undefined ? `#/${target.path}` : ref
        },
        parsePath,
      )
    if (diagnostics) deferredCopies.push(copy)
    else copy()
  }
  const references = documentReferences(
    config.externalDocumentsKey,
    (document, retrievalUri) => {
      for (const resolver of [
        config.hooks?.resolveDocument,
        ...lifecyclePlugin.map((plugin) => plugin.resolveDocument),
      ]) {
        const identity = resolver?.(document, retrievalUri)
        if (identity !== undefined) {
          return identity
        }
      }
      return undefined
    },
    config.preserveReference !== undefined,
    (node) => traversal.location(node)?.context !== 'data',
    (node) => config.traversal !== 'document' || traversal.location(node)?.context === 'schema',
    diagnostics !== undefined,
  )
  references.register(documentRoot, getDefaultOrigin())
  const defaultOrigin = references.origin(documentRoot) ?? getDefaultOrigin()
  const hasRootIdentity = references.identity(documentRoot) !== undefined || getId(documentRoot) !== undefined
  const referenceToRoot = (pointer: string, sourceOrigin: string): string => {
    const fragment = diagnostics
      ? pointer
          .split('/')
          .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
          .join('/')
      : pointer
    return hasRootIdentity && references.isSchemaResource(sourceOrigin) && sourceOrigin !== defaultOrigin
      ? `${defaultOrigin}${fragment}`
      : fragment
  }

  // Copy only owned mappings so writes cannot reach an inherited or shared object.
  const existingMappings = Object.hasOwn(documentRoot, config.externalDocumentsMappingsKey)
    ? documentRoot[config.externalDocumentsMappingsKey]
    : undefined
  const mappings = isObject(existingMappings)
    ? Object.fromEntries(
        Object.entries(existingMappings).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
      )
    : {}
  Object.defineProperty(documentRoot, config.externalDocumentsMappingsKey, {
    value: mappings,
    enumerable: true,
    configurable: true,
    writable: true,
  })
  const { generate } = uniqueValueGeneratorFactory(config.compress ?? getHash, mappings)

  // Index supplied and previously bundled documents before resolving canonical identities.
  const storedDocuments = documentRoot[config.externalDocumentsKey]
  if (isObject(storedDocuments)) {
    for (const [key, document] of Object.entries(storedDocuments)) {
      const retrievalUri = resolveReferencePath(
        defaultOrigin,
        documentRoot[config.externalDocumentsMappingsKey][key] ?? key,
      )
      traversal.register(document, retrievalUri)
      references.register(document, retrievalUri, [config.externalDocumentsKey, key])
    }
  }
  for (const [uri, pending] of [...cache]) {
    const result = await pending
    if (result.ok) {
      const retrievalUri = resolveReferencePath(defaultOrigin, uri)
      const relativeUri = toRelativePath(retrievalUri, defaultOrigin)
      if (diagnostics) cache.set(relativeUri, pending)
      const key = await generate(relativeUri)
      traversal.register(result.data, retrievalUri)
      references.register(result.data, retrievalUri, [config.externalDocumentsKey, key])
    }
  }

  /**
   * Executes lifecycle hooks defined both in the bundler configuration and any extended lifecycle plugins.
   * This utility function ensures that all relevant hooks for a given event type are called in order:
   * - First, the hook directly provided via the config (if present)
   * - Then, all matching hooks from registered lifecycle plugins (if present)
   *
   * Hooks are awaited in sequence for the given event type and argument list.
   *
   * @param type The hook event type, corresponding to a key of Config['hooks'].
   * @param args Arguments to pass to the hook function, matching HookFn<T>.
   */
  const executeHooks = async <T extends keyof Config['hooks']>(
    type: T,
    ...args: Parameters<HookFn<T>>
  ): Promise<void> => {
    // Run hook defined directly in config, if present
    const hook = config.hooks?.[type] as HookFn<T> | undefined
    if (hook) {
      await hook(...args)
    }
    // Additionally run the hook for every lifecycle plugin, if present
    for (const plugin of lifecyclePlugin) {
      const pluginHook = plugin[type] as HookFn<T> | undefined
      if (pluginHook) {
        await pluginHook(...args)
      }
    }
  }

  const pendingAnchors: (() => Promise<void>)[] = []

  const bundler = async (
    root: unknown,
    origin: string = defaultOrigin,
    isChunkParent = false,
    depth = 0,
    currentPath: readonly string[] = [],
    parent: UnknownObject = null,
    referencedFromPath?: readonly string[],
  ) => {
    // If a maximum depth is set in the config, stop bundling when the current depth reaches or exceeds it
    if (config.depth !== undefined && depth > config.depth) {
      return
    }

    if (!isObject(root) && !Array.isArray(root)) {
      return
    }

    const location = traversal.location(root)
    if (location?.context === 'data') return

    // Skip if this node has already been processed to prevent infinite recursion
    // and duplicate processing of the same node
    if (processedNodes.has(root)) {
      return
    }
    // Mark this node as processed before continuing
    processedNodes.add(root)

    // A node with its own `$id` establishes a new base for resolving relative references within it.
    // Fall back to the origin inherited from the parent document otherwise.
    const id = getId(root)
    const nodeOrigin = references.origin(root) ?? (id ? resolveReferencePath(origin, id) : origin)

    const context = {
      path: currentPath,
      referencedFromPath,
      resolutionCache: cache,
      parentNode: parent,
      rootNode: documentRoot as UnknownObject,
      loaders: loaderPlugins,
      origin: nodeOrigin,
    }

    const authoredReference = hasRef(root) ? root.$ref : undefined
    await executeHooks('onBeforeNodeProcess', root as UnknownObject, context)

    const visitChildren = async (): Promise<void> => {
      for (const key of Object.keys(root)) {
        if (key === '$ref' || key === config.externalDocumentsKey || key === config.externalDocumentsMappingsKey)
          continue
        await bundler(
          root[key],
          nodeOrigin,
          isChunkParent,
          depth + 1,
          [...currentPath, key],
          root as UnknownObject,
          referencedFromPath,
        )
      }
    }
    if (hasRef(root) && (!location || isReferenceContext(location.context))) {
      const ref = root['$ref']
      const report = (kind: ReferenceDiagnostic['kind']): void => {
        diagnostics?.push({
          kind,
          reference: authoredReference ?? ref,
          source: location?.source ?? origin,
          pointer: `${location?.pointer ?? '#/' + currentPath.map(escapeJsonPointer).join('/')}/$ref`,
        })
      }
      // Schema and Path Item siblings retain their authored structure; they are not merged.
      if (
        config.traversal === 'document' &&
        (location?.context === 'path-item' || (location?.context === 'schema' && location.schemaSiblings))
      )
        await visitChildren()
      if (config.preserveReference?.(ref, { origin: nodeOrigin })) {
        if (config.traversal !== 'document') await visitChildren()
        await executeHooks('onAfterNodeProcess', root, context)
        return
      }
      const isChunk = '$global' in root && typeof root['$global'] === 'boolean' && root['$global']

      // Try to convert the reference to a local reference if possible
      // This handles cases where the reference points to a local schema using $id or $anchor
      // If it can be converted to a local reference, we do not need to bundle it
      // and can skip further processing for this reference
      // In case of partial bundling, we still need to ensure that all dependencies
      // of the local reference are bundled to create a complete and self-contained partial bundle
      // This is important to maintain the integrity of the partial bundle
      const resolvedLocal = references.resolve(ref, nodeOrigin)
      // Existing consumers retain root pointers beneath embedded schema identifiers.
      const local =
        diagnostics && resolvedLocal?.value === undefined && ref.startsWith('#/') && nodeOrigin !== defaultOrigin
          ? (references.resolve(ref, defaultOrigin) ?? resolvedLocal)
          : resolvedLocal
      const localRef = local?.path

      if (localRef !== undefined) {
        if (diagnostics && local.value === undefined) {
          report('missing-target')
          await executeHooks('onResolveError', root)
          await executeHooks('onAfterNodeProcess', root, context)
          return
        }
        // A fragment under an embedded $id resolves within that schema, not the document.
        // Without a declared root identity, retain references to root resources rather
        // than baking a retrieval location into an otherwise portable bundle.
        const preserveRootResourceReference =
          !hasRootIdentity &&
          local.document === documentRoot &&
          references.isSchemaResource(nodeOrigin) &&
          nodeOrigin !== defaultOrigin
        if (!local.preserveReference && !preserveRootResourceReference) {
          root.$ref = referenceToRoot(localRef ? `#/${localRef}` : '#', nodeOrigin)
        }
        if (
          config.traversal === 'document' &&
          location &&
          isObject(local.value) &&
          local.value !== root &&
          traversal.location(local.value)?.context !== location.context
        ) {
          const source = isObject(local.document) ? traversal.location(local.document)?.source : undefined
          traversal.register(
            local.document,
            source ?? location.source,
            location.context,
            parsePath(`/${localRef}`).slice(local.documentPath.length),
          )
          references.refresh(local.document)
        }
        if (isPartialBundling || (diagnostics && config.traversal === 'document')) {
          const segments = parsePath(`/${localRef}`)
          const parent = segments.length > 0 ? getValueByPath(documentRoot, segments.slice(0, -1)).value : undefined

          const targetValue = {
            value: local.value,
            context: isObject(local.value) ? references.origin(local.value) : nodeOrigin,
          }

          // When doing partial bundling, we need to recursively bundle all dependencies
          // referenced by this local reference to ensure the partial bundle is complete.
          // This includes not just the direct reference but also all its dependencies,
          // creating a complete and self-contained partial bundle.
          //
          // The pointer addresses the root document, so the target's base is the nearest `$id` on
          // the way to it, else the document origin. `getValueByPath` reports no `$id` as an empty
          // string, and handing that on as the origin left a relative reference under the target
          // (a chunk reference written relative to the document) with nothing to resolve against.
          await bundler(
            targetValue.value,
            targetValue.context || defaultOrigin,
            isChunkParent,
            depth + 1,
            segments,
            parent,
            referencedFromPath,
          )
        }
        if (local.documentPath.length > 0) {
          const origin =
            isObject(local.document) || Array.isArray(local.document) ? references.origin(local.document) : nodeOrigin
          await bundler(local.document, origin, isChunkParent, depth + 1, local.documentPath)
          if (config.treeShake) {
            const [key, documentKey] = local.documentPath
            copyReferences(
              documentRoot,
              { [key]: { [documentKey]: local.document } },
              `/${localRef}`,
              key,
              documentKey,
              false,
              new Set(),
              references.identity(local.document)?.metadata,
            )
          }
          if (!config.treeShake || diagnostics) {
            const metadata = references.identity(local.document)?.metadata
            setPath(
              documentRoot,
              `/${local.documentPath.map(escapeJsonPointer).join('/')}`,
              isObject(local.document) && metadata ? { ...local.document, ...metadata } : local.document,
            )
          }
        }
        await executeHooks('onAfterNodeProcess', root, context)
        return
      }

      const [prefix, path = ''] = ref.split('#', 2)
      if (diagnostics && !prefix) {
        // A later fragment may expose an anchor in a document already loaded in memory.
        pendingAnchors.push(async () => {
          const target = references.resolve(ref, nodeOrigin)
          if (target?.value !== undefined) {
            if (!target.preserveReference) root.$ref = referenceToRoot(`#/${target.path}`, nodeOrigin)
          } else {
            report('missing-target')
            await executeHooks('onResolveError', root)
          }
          await executeHooks('onAfterNodeProcess', root, context)
        })
        return
      }

      // Combine the current origin with the new path to resolve relative references
      // correctly within the context of the external file being processed
      const resolvedPath = resolveReferencePath(nodeOrigin, prefix)
      const relativePath = toRelativePath(resolvedPath, defaultOrigin)

      // Generate a unique compressed path for the external document
      // This is used as a key to store and reference the bundled external document
      // The compression helps reduce the overall file size of the bundled document
      const compressedPath = await generate(relativePath)

      const seen = cache.has(relativePath)

      if (!seen) {
        cache.set(relativePath, resolveContents(resolvedPath, loaderPlugins))
      }

      await executeHooks('onResolveStart', root)

      // Resolve the remote document
      const result = await cache.get(relativePath)

      if (result.ok && (!diagnostics || result.data !== undefined)) {
        // Process the result only once to avoid duplicate processing and prevent multiple prefixing
        // of internal references, which would corrupt the reference paths
        if (!seen) {
          const fragmentPath = (() => {
            try {
              return decodeURIComponent(path).split('/').slice(1).map(unescapeJsonPointerSegment)
            } catch {
              return []
            }
          })()
          traversal.register(result.data, resolvedPath, location?.context ?? 'generic', fragmentPath)
          // Index the whole external document before following references within it.
          // Chunks retain the referring context because they are already self-contained.
          if (!isChunk) {
            references.register(result.data, resolvedPath, [config.externalDocumentsKey, compressedPath])
          }

          // Recursively process the resolved content
          // to handle any nested references it may contain. We pass the resolvedPath as the new origin
          // to ensure any relative references within this content are resolved correctly relative to
          // their new location in the bundled document.
          await bundler(
            result.data,
            isChunk ? origin : resolvedPath,
            isChunk,
            depth + 1,
            [config.externalDocumentsKey, compressedPath],
            null,
            // Keep the referring document path across external hops, replacing the storage wrapper.
            referencedFromPath ? [...referencedFromPath, ...currentPath.slice(2)] : currentPath,
          )

          // Store the mapping between hashed keys and original URLs in x-ext-urls
          // This allows tracking which external URLs were bundled and their corresponding locations
          setPath(
            documentRoot,
            `/${config.externalDocumentsMappingsKey}/${escapeJsonPointer(compressedPath)}`,
            relativePath,
          )
        }

        // Validate chunk targets separately so their internal references keep the referring origin.
        const targetReferences =
          isChunk && diagnostics
            ? documentReferences(config.externalDocumentsKey, undefined, false, undefined, undefined, true)
            : references
        if (isChunk && diagnostics) {
          targetReferences.register(result.data, resolvedPath, [config.externalDocumentsKey, compressedPath])
        }
        const finishResolution = async (): Promise<void> => {
          const target = diagnostics ? targetReferences.resolve(ref, nodeOrigin) : undefined
          if (diagnostics && target?.value === undefined) {
            setPath(documentRoot, `/${config.externalDocumentsKey}/${escapeJsonPointer(compressedPath)}`, result.data)
            report('missing-target')
            await executeHooks('onResolveError', root)
            await executeHooks('onAfterNodeProcess', root, context)
            return
          }
          const bundledReference = target
            ? `#/${target.path}`
            : prefixInternalRef(`#${path}`, [config.externalDocumentsKey, compressedPath])
          if (config.treeShake === true) {
            // Store only the subtree that is actually used
            // This optimizes the bundle size by only including the parts of the external document
            // that are referenced, rather than the entire document
            copyReferences(
              documentRoot,
              { [config.externalDocumentsKey]: { [compressedPath]: result.data } },
              bundledReference.substring(1),
              config.externalDocumentsKey,
              compressedPath,
              false,
              new Set(),
              references.identity(result.data)?.metadata,
            )
          }
          if ((!config.treeShake || diagnostics) && !seen) {
            // Store the external document in the main document's x-ext key
            // When tree shaking is disabled, we include the entire external document
            // This preserves all content and is faster since we don't need to analyze and copy
            // specific parts. This approach is ideal when storing the result in memory
            // as it avoids the overhead of tree shaking operations
            const metadata = references.identity(result.data)?.metadata
            setPath(
              documentRoot,
              `/${config.externalDocumentsKey}/${compressedPath}`,
              isObject(result.data) && metadata ? { ...result.data, ...metadata } : result.data,
            )
          }

          // Update the $ref to point to the embedded document in x-ext
          // This is necessary because we need to maintain the correct path context
          // for the embedded document while preserving its internal structure
          root.$ref = referenceToRoot(bundledReference, nodeOrigin)

          await executeHooks('onResolveSuccess', root)

          await executeHooks('onAfterNodeProcess', root, context)
          return
        }
        if (
          diagnostics &&
          path &&
          !path.startsWith('/') &&
          targetReferences.resolve(ref, nodeOrigin)?.value === undefined
        ) {
          pendingAnchors.push(finishResolution)
        } else {
          await finishResolution()
        }
        return
      }

      report('unresolved-document')
      await executeHooks('onResolveError', root)

      await executeHooks('onAfterNodeProcess', root, context)
      if (diagnostics) return
      return console.warn(
        `Failed to resolve external reference "${resolvedPath}". The reference may be invalid, inaccessible, or missing a loader for this type of reference.`,
      )
    }

    // Recursively traverse all child properties of the current object to resolve nested $ref references.
    // This step ensures that any $refs located deeper within the object hierarchy are discovered and processed.
    // We explicitly skip the extension keys (x-ext and x-ext-urls) to avoid reprocessing already bundled or mapped content.
    for (const key in root) {
      if (key === config.externalDocumentsKey || key === config.externalDocumentsMappingsKey) {
        continue
      }

      await bundler(
        root[key],
        nodeOrigin,
        isChunkParent,
        depth + 1,
        [...currentPath, key],
        root as UnknownObject,
        referencedFromPath,
      )
    }

    await executeHooks('onAfterNodeProcess', root as UnknownObject, context)
  }

  await bundler(rawSpecification)
  for (const resolveAnchor of pendingAnchors) await resolveAnchor()

  if (diagnostics && config.treeShake && diagnostics.length === 0) {
    if (storedDocuments === undefined) delete documentRoot[config.externalDocumentsKey]
    else documentRoot[config.externalDocumentsKey] = storedDocuments
    for (const copy of deferredCopies) copy()
  }

  // Cache indexing reserves keys before we know which edges will be preserved.
  // Do not expose reservations for resources that were never included in the output.
  if (config.preserveReference) {
    const documents = documentRoot[config.externalDocumentsKey]
    const mappings = Object.fromEntries(
      Object.entries(documentRoot[config.externalDocumentsMappingsKey]).filter(
        ([key]) => isObject(documents) && Object.hasOwn(documents, key),
      ),
    )
    Object.defineProperty(documentRoot, config.externalDocumentsMappingsKey, {
      value: mappings,
      enumerable: true,
      configurable: true,
      writable: true,
    })
  }

  // Keep urlMappings when doing partial bundling to track hash values and handle collisions
  // For full bundling without urlMap config, remove the mappings to clean up the output
  if (!config.urlMap && !isPartialBundling) {
    // Remove the external document mappings from the output when doing a full bundle without urlMap config
    delete documentRoot[config.externalDocumentsMappingsKey]
  }

  return rawSpecification
}
