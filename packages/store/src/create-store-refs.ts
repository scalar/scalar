import { OpenApiObjectSchema } from '@scalar/openapi-types/schemas/3.1/unprocessed'
import { isReactive, reactive, toRaw } from 'vue'

/**
 * Creates a store with JSON reference resolution capabilities.
 * This store allows working with JSON documents that contain $ref pointers,
 * automatically resolving them when accessed.
 */
export function createStore(input: Record<string, unknown>) {
  // TODO: Normalize
  // TODO: Embed external references
  // TODO: Upgrade
  const content = OpenApiObjectSchema.parse(input)

  // Make the source document reactive for Vue change tracking
  const sourceDocument = reactive(content)

  // Cache for storing resolved reference proxies to handle circular references
  const resolvedProxyCache = new WeakMap()

  /**
   * Parses a JSON Pointer string into an array of path segments
   */
  function parseJsonPointer(referenceString: string): string[] {
    const pathSegments = referenceString.replace(/^#\//, '').split('/')
    return pathSegments.map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
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
   * Creates a proxy that automatically resolves JSON references
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
        shouldRemoveKey(key) {
          return key.startsWith('_')
        },
      })

      return raw
    },
  }
}

/**
 * Recursively removes properties from an object based on a condition
 */
function removeProperties(obj: Record<string, unknown>, options: { shouldRemoveKey: (key: string) => boolean }) {
  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      if (item !== null && typeof item === 'object') {
        removeProperties(item as Record<string, unknown>, options)
      }
    })
  } else {
    for (const key in obj) {
      if (options.shouldRemoveKey(key)) {
        delete obj[key]
      } else if (obj[key] !== null && typeof obj[key] === 'object') {
        removeProperties(obj[key] as Record<string, unknown>, options)
      }
    }
  }
}
