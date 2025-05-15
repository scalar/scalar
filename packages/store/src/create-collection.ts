import { normalize, unescapeJsonPointer } from '@scalar/openapi-parser'
import type { OpenApiObject as ProcessedOpenApiObject } from '@scalar/openapi-types/schemas/3.1/processed'
import type {
  OpenApiObject as UnprocessedOpenApiObject,
  // OpenApiObjectSchema as UnprocessedOpenApiObjectSchema,
} from '@scalar/openapi-types/schemas/3.1/unprocessed'
import { type Ref, isReactive, isRef, reactive, toRaw, watch } from '@vue/reactivity'

export type Collection = ReturnType<typeof createCollection>

type UnknownObject = Record<string, unknown>

export type CreateCollectionOptions = {
  /**
   * Whether to cache the resolved references
   *
   * @default false
   *
   * @deprecated This will probably be removed in the future.
   */
  cache?: boolean
}

// Add a cache for proxies at the module level
const proxyCache = new WeakMap<object, unknown>()

// Cache for proxies of objects that contain $refs
const refProxyCache = new WeakMap<object, unknown>()

/**
 * Creates a store with JSON reference resolution capabilities.
 *
 * This store allows working with JSON documents that contain $ref pointers,
 * automatically resolving them when accessed.
 */
export function createCollection(
  input: UnknownObject | string | Ref<UnknownObject | string>,
  options: CreateCollectionOptions = {},
) {
  const { cache = false } = options

  // Unwrap Ref input if necessary
  let unwrappedInput = isRef(input) ? input.value : input

  // If input is a string (from Ref or direct), normalize it
  if (typeof unwrappedInput === 'string') {
    unwrappedInput = normalize(unwrappedInput) as UnknownObject
  }

  const content = unwrappedInput

  // Only create a cache if cache is true
  const resolvedProxyCache = cache ? new WeakMap() : undefined

  // If input is a Ref<UnknownObject>, use its value directly as the source document
  if (isRef(input) && isObject(input.value)) {
    // Make the root document reactive
    const reactiveRoot = reactive(input.value)
    return {
      document: createRefProxy(reactiveRoot, reactiveRoot) as ProcessedOpenApiObject,
      export: () => exportRawDocument(unwrappedInput) as UnprocessedOpenApiObject,
      apply,
      merge: (partialDocument: UnknownObject) => {
        mergeDocuments(reactiveRoot, partialDocument)
      },
      update: (newDocument: UnknownObject) => {
        updateDocument(reactiveRoot, newDocument)
      },
    }
  }

  // Make the root document reactive
  const reactiveRoot = reactive(content)

  // If input is a Ref<string>, watch for changes and update the reactive document
  if (isRef(input) && typeof input.value === 'string') {
    watch(
      input,
      (newValue) => {
        const normalized = normalize(newValue) as UnknownObject
        // Update the document through merge to ensure proper reactivity
        mergeDocuments(reactiveRoot, normalized)
      },
      { immediate: false },
    )
  }

  // Create a proxy that only handles $ref resolution, using the reactive root
  const documentProxy = createRefProxy(reactiveRoot, reactiveRoot)

  // Store overlays for possible re-application
  const overlays: UnknownObject[] = []

  function apply(singleOrMultipleOverlays: UnknownObject | UnknownObject[]) {
    if (Array.isArray(singleOrMultipleOverlays)) {
      singleOrMultipleOverlays.forEach((overlay) => {
        overlays.push(overlay)
        applyOverlay(reactiveRoot, overlay)
      })
    } else {
      overlays.push(singleOrMultipleOverlays)
      applyOverlay(reactiveRoot, singleOrMultipleOverlays)
    }
  }

  return {
    document: documentProxy as ProcessedOpenApiObject,
    /**
     * Exports the raw OpenAPI document with $ref's intact
     */
    export() {
      return exportRawDocument(reactiveRoot) as UnprocessedOpenApiObject
    },
    apply,
    merge(partialDocument: UnknownObject) {
      return mergeDocuments(reactiveRoot, partialDocument)
    },
    update(newDocument: UnknownObject) {
      return mergeDocuments(reactiveRoot, newDocument)
    },
  }
}

/**
 * Efficiently updates the sourceDocument to match newDocument,
 * only changing top-level keys that are different.
 * This avoids unnecessary deletes/adds for unchanged keys.
 */
function updateDocument(sourceDocument: UnknownObject, newDocument: UnknownObject) {
  // Remove keys that are no longer present
  for (const key of Object.keys(sourceDocument)) {
    if (!(key in newDocument)) {
      delete sourceDocument[key]
    }
  }

  // Add or update changed keys
  for (const [key, value] of Object.entries(newDocument)) {
    if (sourceDocument[key] !== value) {
      sourceDocument[key] = value
    }
  }
}

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

function createProxyHandler(
  sourceDocument: UnknownObject,
  resolvedProxyCache?: WeakMap<object, unknown>,
): ProxyHandler<UnknownObject> {
  return {
    get(target, property, receiver) {
      if (property === '__isProxy') {
        return true
      }

      const value = Reflect.get(target, property, receiver)

      if (isObject(value)) {
        if ('$ref' in value) {
          const ref = value.$ref as string
          const referencePath = parseJsonPointer(ref)
          const resolvedValue = getValueByPath(sourceDocument, referencePath)
          if (resolvedValue) {
            return createMagicProxy(resolvedValue, sourceDocument, resolvedProxyCache)
          }
        }
        // Only pass required arguments
        return createMagicProxy(value, sourceDocument, resolvedProxyCache)
      }

      return value
    },

    set(target: UnknownObject, property: string, newValue: unknown, receiver: UnknownObject) {
      const rawTarget = isReactive(target) ? toRaw(target) : target
      const currentValue = rawTarget[property]

      if (isObject(currentValue) && '$ref' in currentValue && typeof currentValue.$ref === 'string') {
        const referencePath = parseJsonPointer(currentValue.$ref)
        const targetObject = getValueByPath(sourceDocument, referencePath.slice(0, -1))
        const lastPathSegment = referencePath[referencePath.length - 1]

        if (targetObject && lastPathSegment) {
          targetObject[lastPathSegment] = newValue
        }
      } else {
        Reflect.set(rawTarget, property, newValue, receiver)
      }
      return true
    },

    has(target: UnknownObject, key: string) {
      if (typeof key === 'string' && key !== '$ref' && typeof target.$ref === 'string') {
        const referencePath = parseJsonPointer(target['$ref'])
        const resolvedValue = getValueByPath(sourceDocument, referencePath)

        return resolvedValue ? key in resolvedValue : false
      }

      return key in target
    },

    ownKeys(target: UnknownObject) {
      if ('$ref' in target && typeof target.$ref === 'string') {
        const referencePath = parseJsonPointer(target['$ref'])
        const resolvedValue = getValueByPath(sourceDocument, referencePath)

        return resolvedValue ? Reflect.ownKeys(resolvedValue) : []
      }

      return Reflect.ownKeys(target)
    },

    getOwnPropertyDescriptor(target: UnknownObject, key: string) {
      if ('$ref' in target && key !== '$ref' && typeof target.$ref === 'string') {
        const referencePath = parseJsonPointer(target['$ref'])
        const resolvedValue = getValueByPath(sourceDocument, referencePath)

        if (resolvedValue) {
          return Object.getOwnPropertyDescriptor(resolvedValue, key)
        }
      }

      return Object.getOwnPropertyDescriptor(target, key)
    },
  }
}

/**
 * Creates a proxy that automatically resolves JSON references.
 */
export function createMagicProxy(
  targetObject: UnknownObject,
  sourceDocument: UnknownObject,
  resolvedProxyCache?: WeakMap<object, unknown>,
) {
  if (!isObject(targetObject)) return targetObject

  const rawTarget = isReactive(targetObject) ? toRaw(targetObject) : targetObject

  if (resolvedProxyCache?.has(rawTarget)) {
    return resolvedProxyCache.get(rawTarget)
  }

  // Create a handler with the correct context
  const handler = createProxyHandler(sourceDocument, resolvedProxyCache)
  const proxy = new Proxy(rawTarget, handler)

  if (resolvedProxyCache) {
    resolvedProxyCache.set(rawTarget, proxy)
  }

  return proxy
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
      .filter((segment, index) => index !== 0 || segment !== '#')
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
  if (!isObject(obj)) return false

  // Quick check for direct $ref
  if ('$ref' in obj) return true

  // Check nested objects
  for (const value of Object.values(obj)) {
    if (isObject(value) && hasRefs(value)) {
      return true
    }
  }

  return false
}

/**
 * Creates a proxy that handles $ref resolution while using the reactivity from the root document.
 * Only creates proxies for objects that contain $refs to minimize traversal overhead.
 */
function createRefProxy(target: UnknownObject, sourceDocument: UnknownObject): UnknownObject {
  // Check cache first
  if (refProxyCache.has(target)) {
    return refProxyCache.get(target) as UnknownObject
  }

  // If the object doesn't contain any $refs, return it directly
  if (!hasRefs(target)) {
    return target
  }

  const proxy = new Proxy(target, {
    get(target, prop: string | symbol) {
      // Special property to check if this is a proxy
      if (prop === '__isProxy') return true

      const value = target[prop as keyof typeof target]
      if (!isObject(value)) return value

      // Handle $ref resolution
      if ('$ref' in value) {
        const ref = value.$ref as string
        const referencePath = parseJsonPointer(ref)
        const resolvedValue = getValueByPath(sourceDocument, referencePath)
        if (resolvedValue) {
          // Create a proxy for the resolved value that points back to the original
          return createRefProxy(resolvedValue, sourceDocument)
        }
      }

      // For other objects, only create a proxy if they contain $refs
      return createRefProxy(value, sourceDocument)
    },

    set(target: UnknownObject, property: string, newValue: unknown, receiver: UnknownObject) {
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
      if (key in target) return true

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

  return target
}
