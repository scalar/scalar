import { createExternalReferenceFetcher, getAbsoluteUrl } from '@/libs/external-references'
import type { UnknownObject } from '@/types'
import { unescapeJsonPointer } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'
// import type {
//   OpenApiObject as UnprocessedOpenApiObject,
//   OpenApiObjectSchema as UnprocessedOpenApiObjectSchema,
// } from '@scalar/openapi-types/schemas/3.1/unprocessed'
import { reactive, toRaw } from 'vue'

// Defaults
const DEFAULT_STRATEGY = 'eager'

export type Collection = Awaited<ReturnType<typeof createCollection>>

export type CreateCollectionOptions = {
  url?: string
  content?: string | UnknownObject
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
  const documentProxy = createMagicProxy(root, root, externalReferences, url)

  // Store overlays for possible re-application
  const overlays: UnknownObject[] = []

  function apply(singleOrMultipleOverlays: UnknownObject | UnknownObject[]) {
    if (Array.isArray(singleOrMultipleOverlays)) {
      singleOrMultipleOverlays.forEach((overlay) => {
        overlays.push(overlay)

        applyOverlay(root, overlay)
      })
    } else {
      overlays.push(singleOrMultipleOverlays)

      applyOverlay(root, singleOrMultipleOverlays)
    }
  }

  return {
    document: documentProxy as OpenAPI.Document, //ProcessedOpenApiObject,
    /**
     * Exports the raw OpenAPI document with $ref's intact
     */
    export: () => exportRawDocument(root) as OpenAPI.Document, //UnprocessedOpenApiObject
    apply,
    merge: (partialDocument: UnknownObject) => mergeDocuments(root, partialDocument),
    update: (newDocument: UnknownObject) => mergeDocuments(root, newDocument),
    externalReferences,
  }
}

/**
 * Efficiently updates the sourceDocument to match newDocument,
 * only changing top-level keys that are different.
 * This avoids unnecessary deletes/adds for unchanged keys.
 */
// function updateDocument(sourceDocument: UnknownObject, newDocument: UnknownObject) {
//   // Remove keys that are no longer present
//   for (const key of Object.keys(sourceDocument)) {
//     if (!(key in newDocument)) {
//       delete sourceDocument[key]
//     }
//   }

//   // Add or update changed keys
//   for (const [key, value] of Object.entries(newDocument)) {
//     if (sourceDocument[key] !== value) {
//       sourceDocument[key] = value
//     }
//   }
// }

/**
 * Exports a raw document with internal properties (starting with "_") removed.
 */
function exportRawDocument(document: UnknownObject): UnknownObject {
  const raw = toRaw(document)

  removeProperties(raw, {
    test: (key) => key.startsWith('_'),
  })

  return raw
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
 * Recursively removes properties from an object based on a condition.
 *
 * Handles circular references by tracking visited objects.
 */
function removeProperties(
  obj: UnknownObject,
  options: { test: (key: string) => boolean },
  seen: WeakSet<object> = new WeakSet(),
) {
  if (isObject(obj)) {
    if (seen.has(obj)) {
      // Already visited this object, avoid infinite recursion
      return
    }

    seen.add(obj)

    for (const key in obj) {
      if (options.test(key)) {
        delete obj[key]
      } else if (isObject(obj[key])) {
        removeProperties(obj[key] as UnknownObject, options, seen)
      } else if (Array.isArray(obj[key])) {
        // Recursively process each item in the array
        const arr = obj[key] as unknown[]

        arr.forEach((item) => {
          if (isObject(item)) {
            removeProperties(item as UnknownObject, options, seen)
          }
        })
      }
    }
  } else if (Array.isArray(obj)) {
    const arr = obj as unknown[]

    arr.forEach((item) => {
      if (isObject(item)) {
        removeProperties(item as UnknownObject, options, seen)
      }
    })
  }
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
 * Retrieves objects from a document by JSONPath.
 *
 * @see https://www.ietf.org/archive/id/draft-goessner-dispatch-jsonpath-00.html
 *
 * @example
 * ```ts
 * getByJsonPath(document, '$.info')
 *
 * // [{ title: 'My API', version: '1.0.0' }]
 * ```
 */
function getByJsonPath(obj: UnknownObject, path: string): any[] {
  // Only support $ (root), dot/bracket notation, and wildcards for now
  if (!path.startsWith('$')) {
    return []
  }

  if (path === '$') {
    return [obj]
  }

  // Remove leading $
  const segments = path
    .slice(1)
    .replace(/\['([^']+)'\]/g, '.$1') // bracket to dot
    .replace(/\["([^"]+)"\]/g, '.$1')
    .split('.')
    .filter(Boolean)

  let results: unknown[] = [obj]

  for (const seg of segments) {
    if (seg === '*') {
      results = results.flatMap((o) => (isObject(o) ? Object.values(o) : []))
    } else {
      results = results.map((o) => (isObject(o) ? o[seg] : undefined)).filter((v) => v !== undefined)
    }
  }

  return results
}

/**
 * Applies an OpenAPI Overlay to the document.
 *
 * @see https://github.com/OAI/Overlay-Specification/blob/main/versions/1.0.0.md
 */
function applyOverlay(document: UnknownObject, overlay: UnknownObject) {
  // If this is a full Overlay
  if (typeof overlay !== 'object' || !overlay || !('overlay' in overlay) || !('actions' in overlay)) {
    throw new Error('Invalid OpenAPI Overlay')
  }

  const actions = Array.isArray(overlay.actions) ? overlay.actions : []
  for (const action of actions) {
    if (!action.target) {
      continue
    }
    const targets = getByJsonPath(document, action.target)
    for (const target of targets) {
      if (action.remove) {
        // Remove the target from its parent
        // Only works for object properties, not array elements
        // (Full spec supports arrays, but for brevity, we focus on objects)
        // Find parent and key
        const pathSegments = action.target
          .replace(/^\$/, '')
          .replace(/\['([^']+)'\]/g, '.$1')
          .replace(/\["([^"]+)"\]/g, '.$1')
          .split('.')
          .filter(Boolean)
        if (pathSegments.length > 0) {
          const key = pathSegments[pathSegments.length - 1]
          const parentPath = '$' + (pathSegments.length > 1 ? '.' + pathSegments.slice(0, -1).join('.') : '')
          const parents = getByJsonPath(document, parentPath)

          for (const parent of parents) {
            if (typeof parent === 'object' && parent !== null) {
              delete parent[key]
            }
          }
        }
      } else if (action.update && typeof target === 'object' && target !== null) {
        Object.assign(target, action.update)
      }
    }
  }
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
function createMagicProxy(
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
          return createMagicProxy(resolvedValue, sourceDocument, externalReferences, newOrigin)
        }

        return item
      }
      return isObject(item) || Array.isArray(item)
        ? createMagicProxy(item, sourceDocument, externalReferences, origin)
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
          return createMagicProxy(resolvedValue, sourceDocument, externalReferences, newOrigin)
        }
        // If resolvedValue is undefined (external file not loaded yet),
        // return the original value with $ref - it will be re-evaluated when the file loads
        return value
      }

      // For other objects and arrays, create a proxy if they contain $refs
      return createMagicProxy(value, sourceDocument, externalReferences, origin)
    },

    set(target: UnknownObject, property: string, newValue: unknown) {
      const currentValue = target[property]

      // If we're setting a property on a $ref object, update the referenced object
      if (isObject(currentValue) && '$ref' in currentValue) {
        const ref = currentValue.$ref as string
        const referencePath = parseJsonPointer(ref)
        const targetObject = getValueByPath(sourceDocument, referencePath.slice(0, -1))
        const lastPathSegment = referencePath[referencePath.length - 1]

        if (targetObject && lastPathSegment) {
          targetObject[lastPathSegment] = newValue
          return true
        }
      }

      // For normal properties, just set them
      target[property] = newValue
      return true
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

/**
 * Deeply merges source into target, mutating target.
 * Only merges plain objects, not arrays.
 * Uses the reactivity from the root document.
 */
function mergeDocuments(target: UnknownObject, source: UnknownObject) {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key]
      const targetValue = target[key]

      if (isObject(sourceValue) && isObject(targetValue)) {
        // For objects, recursively merge
        mergeDocuments(targetValue as UnknownObject, sourceValue as UnknownObject)
      } else if (isObject(sourceValue)) {
        // If target doesn't have this key or it's not an object,
        // just assign the new object directly
        target[key] = { ...sourceValue }
      } else {
        // For primitive values, just assign
        target[key] = sourceValue
      }
    }
  }

  return target
}
