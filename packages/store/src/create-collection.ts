import { unescapeJsonPointer, upgrade } from '@scalar/openapi-parser'
import { isReactive, reactive, toRaw } from '@vue/reactivity'

export type Collection = ReturnType<typeof createCollection>

/**
 * Creates a store with JSON reference resolution capabilities.
 *
 * This store allows working with JSON documents that contain $ref pointers,
 * automatically resolving them when accessed.
 */
export function createCollection(input: Record<string, unknown> | string) {
  // TODO: Embed external references

  // Upgrade
  const { specification: upgraded } = upgrade(input)

  // TODO: OpenApiObjectSchema.parse is too strict
  // const content = OpenApiObjectSchema.parse(upgraded)
  const content = upgraded

  // Make the source document reactive for Vue change tracking
  const sourceDocument = reactive(content)

  // Cache for storing resolved reference proxies to handle circular references
  const resolvedProxyCache = new WeakMap()

  /**
   * Creates a proxy that automatically resolves JSON references
   *
   * TODO: Any chance we can move this out of createCollection and make it a top-level function?
   * Should improve readability and testability.
   */
  function createReferenceProxy(targetObject: Record<string, unknown>) {
    if (targetObject === null || typeof targetObject !== 'object') {
      return targetObject // Return primitives as-is
    }

    const rawTarget = isReactive(targetObject) ? toRaw(targetObject) : targetObject

    // Return cached proxy if it exists
    if (resolvedProxyCache.has(rawTarget)) {
      return resolvedProxyCache.get(rawTarget)
    }

    const proxyHandler = {
      get(target: Record<string, unknown>, property: string, receiver: Record<string, unknown>) {
        if (property === '__isProxy') {
          return true
        }

        const value = Reflect.get(target, property, receiver)

        if (value && typeof value === 'object') {
          if ('$ref' in value) {
            const referencePath = parseJsonPointer(value.$ref as string)
            const resolvedValue = getValueByPath(sourceDocument, referencePath)

            if (resolvedValue) {
              return createReferenceProxy(resolvedValue)
            }
          }

          // @ts-expect-error TODO: fix this
          return createReferenceProxy(value)
        }

        return value
      },

      set(target: Record<string, unknown>, property: string, newValue: unknown, receiver: Record<string, unknown>) {
        const rawTarget = isReactive(target) ? toRaw(target) : target
        const currentValue = rawTarget[property]

        if (
          currentValue &&
          typeof currentValue === 'object' &&
          '$ref' in currentValue &&
          typeof currentValue.$ref === 'string'
        ) {
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

      has(target: Record<string, unknown>, key: string) {
        if (typeof key === 'string' && key !== '$ref' && typeof target.$ref === 'string') {
          const referencePath = parseJsonPointer(target['$ref'])
          const resolvedValue = getValueByPath(sourceDocument, referencePath)
          return resolvedValue ? key in resolvedValue : false
        }

        return key in target
      },

      ownKeys(target: Record<string, unknown>) {
        if ('$ref' in target && typeof target.$ref === 'string') {
          const referencePath = parseJsonPointer(target['$ref'])
          const resolvedValue = getValueByPath(sourceDocument, referencePath)
          return resolvedValue ? Reflect.ownKeys(resolvedValue) : []
        }
        return Reflect.ownKeys(target)
      },

      getOwnPropertyDescriptor(target: Record<string, unknown>, key: string) {
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

  // Create the root proxy for the entire document
  const documentProxy = createReferenceProxy(sourceDocument)

  return {
    document: documentProxy,
    /**
     * Exports the raw document with references intact
     */
    export() {
      const raw = toRaw(sourceDocument)

      removeProperties(raw, {
        test: (key) => key.startsWith('_'),
      })

      return raw
    },
  }
}

/**
 * Retrieves a nested value from the source document using a path array
 */
function getValueByPath(
  document: Record<string, unknown>,
  pathSegments: string[],
): Record<string, unknown> | undefined {
  return pathSegments.reduce<unknown>(
    (currentValue: unknown, pathSegment) =>
      currentValue && typeof currentValue === 'object' && pathSegment in currentValue
        ? (currentValue as Record<string, unknown>)[pathSegment]
        : undefined,
    document,
  ) as Record<string, unknown> | undefined
}

/**
 * Parses a JSON Pointer string into an array of path segments
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
  obj: Record<string, unknown>,
  options: { test: (key: string) => boolean },
  seen: WeakSet<object> = new WeakSet(),
) {
  if (obj !== null && typeof obj === 'object') {
    if (seen.has(obj)) {
      // Already visited this object, avoid infinite recursion
      return
    }

    seen.add(obj)
  }

  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      if (item !== null && typeof item === 'object') {
        removeProperties(item as Record<string, unknown>, options, seen)
      }
    })
  } else {
    for (const key in obj) {
      if (options.test(key)) {
        delete obj[key]
      } else if (obj[key] !== null && typeof obj[key] === 'object') {
        removeProperties(obj[key] as Record<string, unknown>, options, seen)
      }
    }
  }
}
