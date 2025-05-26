import { createExternalReferenceFetcher, getAbsoluteUrl } from '@/libs/external-references'
import type { UnknownObject } from '@/types'
import { unescapeJsonPointer } from '@scalar/openapi-parser'
import type { OpenApiObject as ProcessedOpenApiObject } from '@scalar/openapi-types/schemas/3.1/processed'
import type { OpenApiObject as UnprocessedOpenApiObject } from '@scalar/openapi-types/schemas/3.1/unprocessed'
import { reactive, readonly, toRaw } from 'vue'
import { ERRORS } from './errors'

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

  // Wait until the first file is fetched
  await externalReferences.isReady()

  if (url) {
    if (externalReferences.getReference(url)?.status !== 'fetched') {
      throw new Error(ERRORS.FAILED_TO_FETCH_OPENAPI_DOCUMENT, { cause: externalReferences.getReference(url)?.errors })
    }
  }

  // Normalized and upgraded content, doesn't matter where it came from.
  const content = externalReferences.getReference(url)?.content || {}

  if (!isObject(content) || (typeof content.openapi !== 'string' && typeof content.swagger !== 'string')) {
    throw new Error(ERRORS.INVALID_SPECIFICATION_VERSION)
  }

  // Make the root document reactive
  const root = reactive(content)

  // Create a proxy that only handles $ref resolution, using the reactive root
  const documentProxy = createOpenApiProxy(root, root, externalReferences, url) as UnknownObject

  return {
    document: readonly(documentProxy) as Readonly<ProcessedOpenApiObject>,
    /**
     * Exports the raw OpenAPI document with $ref's intact
     *
     * TODO: type UnprocessedOpenApiObject
     */
    export: () => exportRawDocument(root),
    externalReferences,
  }
}

/**
 * Exports a raw OpenAPI document (containing $ref's)
 */
export function exportRawDocument(document: UnknownObject): Readonly<UnknownObject> {
  return readonly(toRaw(document) as UnprocessedOpenApiObject)
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
export function getValueByPath(document: UnknownObject, pathSegments: string[]): UnknownObject | undefined {
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
export function parseJsonPointer(pointer: string): string[] {
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
export function isObject(value: unknown): value is UnknownObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Checks if an object or any of its nested objects contain a $ref
 */
export function hasRefs(obj: unknown): boolean {
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
export function resolveRef(
  ref: string | unknown,
  sourceDocument: UnknownObject,
  externalReferences?: ReturnType<typeof createExternalReferenceFetcher>,
  origin?: string,
): UnknownObject | undefined {
  if (typeof ref !== 'string') {
    return undefined
  }

  // Internal references
  if (ref.startsWith('#')) {
    const referencePath = parseJsonPointer(ref)
    return getValueByPath(sourceDocument, referencePath)
  }

  // External references
  if (!origin || !externalReferences) {
    console.warn(ERRORS.CANNOT_RESOLVE_EXTERNAL_REFERENCE(ref as string))

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
export function createOpenApiProxy(
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
          const newOrigin = getAbsoluteUrl(origin, filePath)

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
    get(targetObject: UnknownObject, prop: string | symbol, receiver: any) {
      if (prop === '__isProxy') {
        return true
      }

      // If targetObject itself is a $ref, resolve it first before trying to get any other property.
      // This handles cases like accessing `level1.name` where `level1` is a proxy for an object like `{ $ref: "#/..." }`.
      if (prop !== '$ref' && typeof prop === 'string' && '$ref' in targetObject) {
        const targetRef = targetObject.$ref as string
        const resolvedTarget = resolveRef(targetRef, sourceDocument, externalReferences, origin)

        if (resolvedTarget) {
          // Create a proxy for the resolved target to handle any further resolutions or deep $refs.
          const proxiedResolvedTarget = createOpenApiProxy(resolvedTarget, sourceDocument, externalReferences, origin)

          // Get the originally requested property (`prop`) from this new proxy/object.
          // This will trigger another 'get' if proxiedResolvedTarget is a proxy.
          return Reflect.get(proxiedResolvedTarget as object, prop, receiver)
        }

        // If targetObject.$ref could not be resolved, the property `prop` is effectively undefined.
        return undefined
      }

      // If targetObject was not a $ref (or if `prop` was '$ref'), proceed to get the property value directly.
      const value = Reflect.get(targetObject, prop, receiver)

      // If the property's value itself is a $ref object (e.g., target.someProperty = { $ref: "..." }),
      // resolve and proxy it.
      if (isObject(value) && '$ref' in value) {
        const valueRef = value.$ref as string
        const resolvedValue = resolveRef(valueRef, sourceDocument, externalReferences, origin)
        if (resolvedValue) {
          const [filePath] = valueRef.split('#')
          const newOrigin = getAbsoluteUrl(origin, filePath)
          return createOpenApiProxy(resolvedValue, sourceDocument, externalReferences, newOrigin)
        }
        return value // Return original unresolved $ref object
      }

      // If the value is an object or array (but not a $ref itself, as handled above),
      // it might contain nested $refs, so it needs to be proxied.
      if (isObject(value) || Array.isArray(value)) {
        return createOpenApiProxy(value, sourceDocument, externalReferences, origin)
      }

      // Otherwise, the value is a primitive or doesn't need further proxying for this access.
      return value
    },

    has(targetObject: UnknownObject, key: string) {
      // Quick path for direct property access
      if (key in targetObject) {
        return true
      }

      // Only check $ref resolution if the key isn't found directly
      if (typeof key === 'string' && key !== '$ref' && '$ref' in targetObject) {
        const ref = targetObject.$ref as string
        const resolvedValue = resolveRef(ref, sourceDocument, externalReferences, origin)
        if (resolvedValue) {
          const proxiedValue = createOpenApiProxy(resolvedValue, sourceDocument, externalReferences, origin)
          return isObject(proxiedValue) && key in proxiedValue
        }
      }

      return false
    },

    ownKeys(targetObject: UnknownObject) {
      // Quick path for direct property access
      if (!('$ref' in targetObject)) {
        return Reflect.ownKeys(targetObject)
      }

      // Only resolve $ref if the object has one
      const ref = targetObject.$ref as string
      const resolvedValue = resolveRef(ref, sourceDocument, externalReferences, origin)
      if (resolvedValue) {
        const proxiedValue = createOpenApiProxy(resolvedValue, sourceDocument, externalReferences, origin)
        return isObject(proxiedValue) ? Reflect.ownKeys(proxiedValue) : Reflect.ownKeys(targetObject)
      }

      return Reflect.ownKeys(targetObject)
    },

    getOwnPropertyDescriptor(targetObject: UnknownObject, key: string) {
      // Quick path for direct property access
      if (!('$ref' in targetObject) || key === '$ref') {
        return Object.getOwnPropertyDescriptor(targetObject, key)
      }

      // Only resolve $ref if the object has one and we're not looking for the $ref itself
      const ref = targetObject.$ref as string
      const resolvedValue = resolveRef(ref, sourceDocument, externalReferences, origin)
      if (resolvedValue) {
        const proxiedValue = createOpenApiProxy(resolvedValue, sourceDocument, externalReferences, origin)
        return isObject(proxiedValue)
          ? Object.getOwnPropertyDescriptor(proxiedValue, key)
          : Object.getOwnPropertyDescriptor(targetObject, key)
      }

      return Object.getOwnPropertyDescriptor(targetObject, key)
    },
  })

  // Cache the proxy
  refProxyCache.set(target, proxy)

  return proxy
}
