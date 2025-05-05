import { normalize, unescapeJsonPointer, upgrade } from '@scalar/openapi-parser'
import { OpenApiObjectSchema } from '@scalar/openapi-types/schemas/3.1/unprocessed'
import { type Ref, isReactive, isRef, reactive, toRaw, watch } from '@vue/reactivity'

export type Collection = ReturnType<typeof createCollection>

type UnknownObject = Record<string, unknown>

/**
 * Creates a store with JSON reference resolution capabilities.
 *
 * This store allows working with JSON documents that contain $ref pointers,
 * automatically resolving them when accessed.
 */
export function createCollection(input: UnknownObject | string | Ref<UnknownObject | string>) {
  // Unwrap Ref input if necessary
  let unwrappedInput = isRef(input) ? input.value : input

  // If input is a string (from Ref or direct), normalize it
  if (typeof unwrappedInput === 'string') {
    unwrappedInput = normalize(unwrappedInput) as UnknownObject
  }

  // TODO: Embed external references

  // Upgrade
  const { specification: upgraded } = upgrade(unwrappedInput)

  // TODO: OpenApiObjectSchema.parse is too strict
  const content = OpenApiObjectSchema.parse(upgraded)

  // If input is a Ref<UnknownObject>, use its value directly as the source document
  if (isRef(input) && isObject(input.value)) {
    // Cache for storing resolved reference proxies to handle circular references
    const resolvedProxyCache = new WeakMap()

    return {
      document: createReferenceProxy(input.value, input.value, resolvedProxyCache),
      export: () => exportRawDocument(unwrappedInput),
    }
  }

  // Make the source document reactive for Vue change tracking
  const sourceDocument = reactive(content)

  // If input is a Ref<string>, watch for changes and update the reactive document
  if (isRef(input) && typeof input.value === 'string') {
    watch(input, (newValue) => updateReactiveDocument(sourceDocument, newValue), { immediate: false })
  }

  // Cache for storing resolved reference proxies to handle circular references
  const resolvedProxyCache = new WeakMap()

  // Create the root proxy for the entire document using the top-level function
  const documentProxy = createReferenceProxy(sourceDocument, sourceDocument, resolvedProxyCache)

  return {
    document: documentProxy,
    /**
     * Exports the raw document with references intact
     */
    export() {
      return exportRawDocument(sourceDocument)
    },
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

/**
 * Creates a proxy that automatically resolves JSON references.
 */
function createReferenceProxy(
  /** The object to wrap in a proxy */
  targetObject: UnknownObject,
  /** The root reactive document for reference resolution */
  sourceDocument: UnknownObject,
  /** A WeakMap for caching proxies to handle circular references */
  resolvedProxyCache: WeakMap<object, unknown>,
) {
  if (!isObject(targetObject)) {
    return targetObject // Return primitives as-is
  }

  const rawTarget = isReactive(targetObject) ? toRaw(targetObject) : targetObject

  // Return cached proxy if it exists
  if (resolvedProxyCache.has(rawTarget)) {
    return resolvedProxyCache.get(rawTarget)
  }

  const proxyHandler = {
    get(target: UnknownObject, property: string, receiver: UnknownObject) {
      if (property === '__isProxy') {
        return true
      }

      const value = Reflect.get(target, property, receiver)

      if (isObject(value)) {
        if ('$ref' in value) {
          const referencePath = parseJsonPointer(value.$ref as string)
          const resolvedValue = getValueByPath(sourceDocument, referencePath)

          if (resolvedValue) {
            return createReferenceProxy(resolvedValue, sourceDocument, resolvedProxyCache)
          }
        }

        // @ts-expect-error TODO: fix this
        return createReferenceProxy(value, sourceDocument, resolvedProxyCache, parseJsonPointer, getValueByPath)
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

  const proxy = new Proxy(targetObject, proxyHandler)

  resolvedProxyCache.set(rawTarget, proxy)

  return proxy
}

/**
 * Updates a reactive document with the normalized content of a new string value.
 * Removes all existing keys and adds new ones from the normalized object.
 */
function updateReactiveDocument(sourceDocument: UnknownObject, newValue: string) {
  const normalized = normalize(newValue)

  // Remove all existing keys
  Object.keys(sourceDocument).forEach((key) => {
    delete sourceDocument[key as keyof typeof sourceDocument]
  })

  // Add new keys
  Object.entries(normalized).forEach(([key, value]) => ((sourceDocument as UnknownObject)[key] = value))
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
