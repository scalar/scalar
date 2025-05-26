import { createExternalReferenceFetcher, getAbsoluteUrl } from '@/libs/external-references'
import type { UnknownObject } from '@/types'
import { unescapeJsonPointer } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'
import { reactive, toRaw } from 'vue'

// Defaults
const DEFAULT_STRATEGY = 'eager'

export type Collection = Awaited<ReturnType<typeof createCollection>>

export type CreateCollectionOptions = {
  /**
   * The URL of the OpenAPI document.
   *
   * @default undefined
   */
  url?: string
  /*
   * The content of an OpenAPI document.
   *
   * @default undefined
   */
  content?: string | UnknownObject
  /**
   * Whether to load external references right-away or only when needed.
   *
   * - `eager`: Load all external references right-away.
   * - `lazy`: Load external references only when the relevant $ref is accessed.
   *
   * @default 'eager'
   */
  strategy?: 'lazy' | 'eager'
}

// Cache for proxies of objects that contain $refs
const refProxyCache = new WeakMap<object, unknown>()

/**
 * Creates a store with JSON reference resolution capabilities.
 *
 * This store allows working with JSON documents that contain $ref pointers,
 * automatically resolving them when accessed.
 */
export async function createCollection({
  url,
  content: providedContent,
  strategy = DEFAULT_STRATEGY,
}: CreateCollectionOptions) {
  const externalReferences = createExternalReferenceFetcher({
    url,
    content: providedContent,
    // Only load the base document, load external references only when needed
    strategy,
  })

  // Wait until the first file is loaded
  await externalReferences.isReady()

  if (url) {
    if (externalReferences.getReference(url)?.status !== 'fetched') {
      throw new Error('Failed to fetch OpenAPI document', { cause: externalReferences.getReference(url)?.errors })
    }
  }

  // Normalized and upgraded content, doesn't matter where it came from.
  const content = externalReferences.getReference(url)?.content || {}

  if (!isObject(content) || (typeof content.openapi !== 'string' && typeof content.swagger !== 'string')) {
    throw new Error('Invalid OpenAPI/Swagger document, failed to find a specification version.')
  }

  // Make the root document reactive
  const root = reactive(content)

  // Create a proxy that only handles $ref resolution, using the reactive root
  const documentProxy = createOpenApiProxy(root, root, externalReferences, url)

  return {
    document: documentProxy as OpenAPI.Document, //ProcessedOpenApiObject,
    /**
     * Exports the raw OpenAPI document with $ref's intact
     */
    export: () => exportRawDocument(root) as OpenAPI.Document, //UnprocessedOpenApiObject
    externalReferences,
  }
}

/**
 * Exports a raw OpenAPI document (containing $ref's)
 */
function exportRawDocument(document: UnknownObject): UnknownObject {
  return toRaw(document)
}

/**
 * Retrieves a nested value from the source document using a path array
 *
 * @example
 * ```ts
 * getValueByPath(document, ['components', 'schemas', 'User'])
 *
 * // { id: '123', name: 'John Doe' }
 * ```
 */
function getValueByPath(document: UnknownObject, pathSegments: string[]): UnknownObject | undefined {
  return pathSegments.reduce<unknown>(
    (currentValue: unknown, pathSegment) =>
      isObject(currentValue) && pathSegment in currentValue ? (currentValue as UnknownObject)[pathSegment] : undefined,
    document,
  ) as UnknownObject | undefined
}

/**
 * Parses a JSON Pointer string into an array of path segments
 *
 * @example
 * ```ts
 * parseJsonPointer('#/components/schemas/User')
 *
 * // ['components', 'schemas', 'User']
 * ```
 */
function parseJsonPointer(pointer: string): string[] {
  return (
    pointer
      // Split on '/'
      .split('/')
      // Remove the leading '#' if present
      .filter((segment, index) => index !== 0 || (segment !== '#' && segment !== ''))
      // Unescape the segments (e.g. ~1 -> /, ~0 -> ~, %20 -> space)
      .map(unescapeJsonPointer)
  )
}

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
function isObject(value: unknown): value is UnknownObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Checks if an object or any of its nested objects contain a $ref
 */
function hasRefs(obj: unknown): boolean {
  if (!isObject(obj) && !Array.isArray(obj)) {
    return false
  }

  // Quick check for direct $ref
  if (isObject(obj) && '$ref' in obj) {
    return true
  }

  // Check nested objects and arrays
  const values = Array.isArray(obj) ? obj : Object.values(obj)
  for (const value of values) {
    if ((isObject(value) || Array.isArray(value)) && hasRefs(value)) {
      return true
    }
  }

  return false
}

/**
 * Resolves a $ref value by either looking up internal references in the current file
 * or fetching external references through the externalReferences system.
 * Returns undefined if the external reference is not yet loaded.
 */
function resolveRef(
  ref: string,
  sourceDocument: UnknownObject,
  externalReferences?: ReturnType<typeof createExternalReferenceFetcher>,
  origin?: string,
): UnknownObject | undefined {
  // Internal references
  if (ref.startsWith('#')) {
    const referencePath = parseJsonPointer(ref)
    return getValueByPath(sourceDocument, referencePath)
  }

  // External references
  if (!origin || !externalReferences) {
    console.warn('Cannot resolve external reference without origin or externalReferences:', ref)
    return undefined
  }

  // Split the reference into file path and JSON pointer
  const [filePath, pointer = '#'] = ref.split('#')
  const absoluteUrl = getAbsoluteUrl(origin, filePath)

  // Add the URL to be fetched if not already present
  externalReferences.addReference(absoluteUrl)

  // Get the file if it's already loaded
  const file = externalReferences.getReference(absoluteUrl)

  if (!file) {
    return undefined
  }

  // Resolve the pointer within the external file
  const referencePath = parseJsonPointer(pointer)
  return getValueByPath(file.content, referencePath)
}

/**
 * Creates a proxy that handles $ref resolution while using the reactivity from the root document.
 * Only creates proxies for objects that contain $refs to minimize traversal overhead.
 */
function createOpenApiProxy(
  target: unknown,
  sourceDocument: UnknownObject,
  externalReferences?: ReturnType<typeof createExternalReferenceFetcher>,
  origin?: string,
): unknown {
  // Handle arrays
  if (Array.isArray(target)) {
    return target.map((item) => {
      if (isObject(item) && '$ref' in item) {
        const ref = item.$ref as string
        const resolvedValue = resolveRef(ref, sourceDocument, externalReferences, origin)
        if (resolvedValue) {
          // Calculate the new origin based on the resolved reference
          const [filePath] = ref.split('#')
          const newOrigin = getAbsoluteUrl(origin || '', filePath)
          // Pass the new origin for nested references
          return createOpenApiProxy(resolvedValue, sourceDocument, externalReferences, newOrigin)
        }

        return item
      }
      return isObject(item) || Array.isArray(item)
        ? createOpenApiProxy(item, sourceDocument, externalReferences, origin)
        : item
    })
  }

  // Handle non-objects
  if (!isObject(target)) {
    return target
  }

  // Check cache first
  if (refProxyCache.has(target)) {
    return refProxyCache.get(target)
  }

  // If the object doesn't contain any $refs, return it directly
  if (!hasRefs(target)) {
    return target
  }

  const proxy = new Proxy(target, {
    get(target, prop: string | symbol) {
      // Special property to check if this is a proxy
      if (prop === '__isProxy') {
        return true
      }

      const value = target[prop as keyof typeof target]

      if (!isObject(value) && !Array.isArray(value)) {
        return value
      }

      // Handle $ref resolution
      if (isObject(value) && '$ref' in value) {
        const ref = value.$ref as string
        const resolvedValue = resolveRef(ref, sourceDocument, externalReferences, origin)

        if (resolvedValue) {
          // Calculate the new origin based on the resolved reference
          const [filePath] = ref.split('#')
          const newOrigin = getAbsoluteUrl(origin || '', filePath)
          // Pass the new origin for nested references
          return createOpenApiProxy(resolvedValue, sourceDocument, externalReferences, newOrigin)
        }
        // If resolvedValue is undefined (external file not loaded yet),
        // return the original value with $ref - it will be re-evaluated when the file loads
        return value
      }

      // For other objects and arrays, create a proxy if they contain $refs
      return createOpenApiProxy(value, sourceDocument, externalReferences, origin)
    },

    has(target: UnknownObject, key: string) {
      // Quick path for direct property access
      if (key in target) {
        return true
      }

      // Only check $ref resolution if the key isn't found directly
      if (typeof key === 'string' && key !== '$ref' && '$ref' in target) {
        const ref = target.$ref as string
        const referencePath = parseJsonPointer(ref)
        const resolvedValue = getValueByPath(sourceDocument, referencePath)
        return resolvedValue ? key in resolvedValue : false
      }

      return false
    },

    ownKeys(target: UnknownObject) {
      // Quick path for direct property access
      if (!('$ref' in target)) {
        return Reflect.ownKeys(target)
      }

      // Only resolve $ref if the object has one
      const ref = target.$ref as string
      const referencePath = parseJsonPointer(ref)
      const resolvedValue = getValueByPath(sourceDocument, referencePath)
      return resolvedValue ? Reflect.ownKeys(resolvedValue) : []
    },

    getOwnPropertyDescriptor(target: UnknownObject, key: string) {
      // Quick path for direct property access
      if (!('$ref' in target) || key === '$ref') {
        return Object.getOwnPropertyDescriptor(target, key)
      }

      // Only resolve $ref if the object has one and we're not looking for the $ref itself
      const ref = target.$ref as string
      const referencePath = parseJsonPointer(ref)
      const resolvedValue = getValueByPath(sourceDocument, referencePath)
      if (resolvedValue) {
        return Object.getOwnPropertyDescriptor(resolvedValue, key)
      }

      return Object.getOwnPropertyDescriptor(target, key)
    },
  })

  // Cache the proxy
  refProxyCache.set(target, proxy)

  return proxy
}
