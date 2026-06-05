import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'

import { convertToLocalRef } from '@/helpers/convert-to-local-ref'
import type { DynamicAnchorEntry, SchemaMap } from '@/helpers/get-schemas'
import { getId, getSchemas } from '@/helpers/get-schemas'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { createPathFromSegments } from '@/helpers/json-path-utils'
import type { UnknownObject } from '@/types'

const isMagicProxy = Symbol('isMagicProxy')
const magicProxyTarget = Symbol('magicProxyTarget')

const REF_VALUE = '$ref-value'
const REF_KEY = '$ref'
const DYNAMIC_REF_KEY = '$dynamicRef'

/**
 * Resolves a $dynamicAnchor to the correct anchor path using scope-aware lookup.
 *
 * Per JSON Schema 2020-12, $dynamicRef resolution walks outward through the dynamic
 * scope (the chain of schema resources entered via $ref), using the first matching
 * $dynamicAnchor from the outermost resource. The dynamicScope array represents this
 * chain — the last element is the innermost enclosing resource.
 *
 * Resolution order:
 * 1. Walk the dynamic scope from innermost to outermost
 * 2. Use the first entry whose resourceId matches a scope level
 * 3. If no scope match, use the current context to find a matching entry
 * 4. If still no match, use the last entry as fallback
 *
 * @param anchorName - The anchor name (without # prefix) from $dynamicRef
 * @param dynamicScope - Stack of enclosing resource $id values (innermost last)
 * @param dynamicAnchors - Map of anchor names to their entries with resource scoping
 * @param currentContext - The $id of the current resource (for non-$ref resolution)
 * @returns The anchor path to resolve to, or undefined if not found
 */
const resolveDynamicAnchor = (
  anchorName: string,
  dynamicScope: string[],
  dynamicAnchors: Map<string, DynamicAnchorEntry[]>,
  currentContext: string,
): string | undefined => {
  const entries = dynamicAnchors.get(anchorName)
  if (!entries || entries.length === 0) {
    return undefined
  }

  if (entries.length === 1) {
    return entries[0].anchorPath
  }

  // Walk the dynamic scope from innermost to outermost
  for (let i = dynamicScope.length - 1; i >= 0; i--) {
    const scopeId = dynamicScope[i]
    if (!scopeId) continue

    const exactMatch = entries.find((e) => e.resourceId === scopeId)
    if (exactMatch) {
      return exactMatch.anchorPath
    }

    const pathMatch = entries.find((e) => e.anchorPath.startsWith(scopeId + '/'))
    if (pathMatch) {
      return pathMatch.anchorPath
    }
  }

  // Check current context
  if (currentContext) {
    const contextMatch = entries.find((e) => e.resourceId === currentContext)
    if (contextMatch) {
      return contextMatch.anchorPath
    }
  }

  // Fallback: last entry (template's own placeholder or final override)
  return entries[entries.length - 1].anchorPath
}

/**
 * Creates a "magic" proxy for a given object or array, enabling transparent access to
 * JSON Reference ($ref) values as if they were directly present on the object.
 *
 * Features:
 * - If an object contains a `$ref` property, accessing the special `$ref-value` property will resolve and return the referenced value from the root object.
 * - All nested objects and arrays are recursively wrapped in proxies, so reference resolution works at any depth.
 * - Properties starting with `__scalar_` are considered internal and are hidden by default: they return undefined on access, are excluded from enumeration, and `'in'` checks return false. This can be overridden with the `showInternal` option.
 * - Setting, deleting, and enumerating properties works as expected, including for proxied references.
 * - Ensures referential stability by caching proxies for the same target object.
 *
 * @param target - The object or array to wrap in a magic proxy
 * @param options - Optional settings (e.g., showInternal to expose internal properties)
 * @param args - Internal arguments for advanced usage (root object, proxy/cache maps, current context)
 * @returns A proxied version of the input object/array with magic $ref-value support
 *
 * @example
 * const input = {
 *   definitions: {
 *     foo: { bar: 123 }
 *   },
 *   refObj: { $ref: '#/definitions/foo' },
 *   __scalar_internal: 'hidden property'
 * }
 * const proxy = createMagicProxy(input)
 *
 * // Accessing proxy.refObj['$ref-value'] will resolve to { bar: 123 }
 * console.log(proxy.refObj['$ref-value']) // { bar: 123 }
 *
 * // Properties starting with __scalar_ are hidden
 * console.log(proxy.__scalar_internal) // undefined
 * console.log('__scalar_internal' in proxy) // false
 * console.log(Object.keys(proxy)) // ['definitions', 'refObj'] (no '__scalar_internal')
 *
 * // Setting and deleting properties works as expected
 * proxy.refObj.extra = 'hello'
 * delete proxy.refObj.extra
 */
export const createMagicProxy = <T extends Record<keyof T & symbol, unknown>, S extends UnknownObject>(
  target: T,
  options?: Partial<{ showInternal: boolean }>,
  args: {
    /**
     * The root object for resolving local JSON references.
     */
    root: S | T
    /**
     * Cache to store already created proxies for target objects to ensure referential stability.
     *
     * It is helpful when dealing with reactive frameworks like Vue,
     */
    proxyCache: WeakMap<object, T>
    /**
     * Cache to store resolved JSON references.
     */
    cache: Map<string, unknown>
    /**
     * Map of all schemas by their $id or $anchor for cross-document reference resolution.
     */
    schemas: SchemaMap
    /**
     * The current JSON path context within the root object.
     *
     * Used to resolve $anchor references correctly.
     */
    currentContext: string
    /**
     * Stack of enclosing resource $id values for $dynamicRef scope-aware resolution.
     * Each entry is a $id encountered when following a $ref chain.
     * The last entry is the innermost enclosing resource.
     */
    dynamicScope: string[]
    /**
     * Secondary proxy cache keyed by (target, dynamicScope) for targets accessed
     * with different dynamic scopes. Only used when dynamicScope is non-empty.
     */
    scopeCache: Map<object, Map<string, T>>
  } = {
    root: target,
    proxyCache: new WeakMap(),
    cache: new Map(),
    schemas: getSchemas(target) as SchemaMap,
    currentContext: '',
    dynamicScope: [],
    scopeCache: new Map(),
  },
): T => {
  if (!isObject(target) && !Array.isArray(target)) {
    return target
  }

  // For targets with dynamic scope, use a scope-aware cache keyed by (target, scope)
  // to ensure the same underlying object gets different proxies in different $ref contexts
  if (args.dynamicScope.length > 0) {
    const scopeKey = args.dynamicScope.join(',')
    const targetScopes = args.scopeCache.get(target)
    if (targetScopes?.has(scopeKey)) {
      return targetScopes.get(scopeKey)!
    }
  } else if (args.proxyCache.has(target)) {
    // No dynamic scope — use the simple proxy cache for referential stability
    return args.proxyCache.get(target)
  }

  const handler: ProxyHandler<T> = {
    /**
     * Proxy "get" trap for magic proxy.
     * - If accessing the special isMagicProxy symbol, return true to identify proxy.
     * - If accessing the magicProxyTarget symbol, return the original target object.
     * - Hide properties starting with __scalar_ by returning undefined.
     * - If accessing "$ref-value" and the object has a local $ref, resolve and return the referenced value as a new magic proxy.
     * - For all other properties, recursively wrap the returned value in a magic proxy (if applicable).
     */
    get(target, prop, receiver) {
      if (prop === isMagicProxy) {
        // Used to identify if an object is a magic proxy
        return true
      }

      if (prop === magicProxyTarget) {
        // Used to retrieve the original target object from the proxy
        return target
      }

      // Hide properties starting with __scalar_ - these are considered internal/private properties
      // and should not be accessible through the magic proxy interface
      if (typeof prop === 'string' && prop.startsWith('__scalar_') && !options?.showInternal) {
        return undefined
      }

      // Get the $ref value of the current target (if any)
      const ref = Reflect.get(target, REF_KEY, receiver)
      // Get the $dynamicRef value of the current target (if any)
      const dynamicRef = Reflect.get(target, DYNAMIC_REF_KEY, receiver)
      // Get the identifier ($id) of the current target for context tracking
      const id = getId(target)

      // If accessing "$ref-value" and $ref is a non-empty local reference, resolve and return the referenced value
      // An empty $ref string is a TypeBox coercion artifact on $dynamicRef nodes — skip it
      if (prop === REF_VALUE && typeof ref === 'string' && ref !== '') {
        const enclosingId = id ?? args.currentContext
        const cacheKey = enclosingId ? `${ref}:${enclosingId}` : ref

        let callerIdentity = enclosingId
        if (!callerIdentity) {
          callerIdentity = args.schemas.objectPaths.get(target as object) ?? ''
        }
        const effectiveCaller = callerIdentity || ''
        const newDynamicScope =
          effectiveCaller && !args.dynamicScope.includes(effectiveCaller)
            ? [...args.dynamicScope, effectiveCaller]
            : args.dynamicScope
        const scopeKey = newDynamicScope.join(',')

        // Use regular cache only when no dynamic scope
        if (scopeKey === '' && args.cache.has(cacheKey)) {
          return args.cache.get(cacheKey)
        }

        const path = convertToLocalRef(ref, id ?? args.currentContext, args.schemas)

        if (path === undefined) {
          return undefined
        }

        // Resolve the reference and create a new magic proxy
        const resolvedValue = getValueByPath(args.root, parseJsonPointerSegments(`/${path}`))
        // Return early if the value is already a magic proxy
        if (isMagicProxyObject(resolvedValue.value)) {
          return resolvedValue.value
        }

        // Check scope cache for this (target, scope) combination
        if (scopeKey !== '') {
          const targetScopes = args.scopeCache.get(resolvedValue.value)
          if (targetScopes?.has(scopeKey)) {
            return targetScopes.get(scopeKey)
          }
        }

        const proxiedValue = createMagicProxy(resolvedValue.value, options, {
          ...args,
          currentContext: resolvedValue.context,
          dynamicScope: newDynamicScope,
        })

        // Store in regular cache only when no dynamic scope
        if (scopeKey === '') {
          args.cache.set(cacheKey, proxiedValue)
        }

        return proxiedValue
      }

      // If accessing "$ref-value" and the node has $dynamicRef (but no meaningful $ref), resolve the dynamic reference
      // An empty $ref string from TypeBox coercion is treated as absent
      if (prop === REF_VALUE && (typeof ref !== 'string' || ref === '') && typeof dynamicRef === 'string') {
        const cacheKey = `${DYNAMIC_REF_KEY}:${dynamicRef}:${args.dynamicScope.join(',')}`
        if (args.cache.has(cacheKey)) {
          return args.cache.get(cacheKey)
        }

        const anchorName = dynamicRef.startsWith('#') ? dynamicRef.substring(1) : dynamicRef

        const anchorPath = resolveDynamicAnchor(
          anchorName,
          args.dynamicScope,
          args.schemas.dynamicAnchors,
          id ?? args.currentContext,
        )

        if (anchorPath) {
          const resolvedValue = getValueByPath(args.root, parseJsonPointerSegments(`/${anchorPath}`))
          if (isMagicProxyObject(resolvedValue.value)) {
            return resolvedValue.value
          }
          const proxiedValue = createMagicProxy(resolvedValue.value, options, {
            ...args,
            currentContext: resolvedValue.context,
          })
          args.cache.set(cacheKey, proxiedValue)
          return proxiedValue
        }

        return undefined
      }

      // For all other properties, recursively wrap the value in a magic proxy
      const value = Reflect.get(target, prop, receiver)

      // Return early if the value is already a magic proxy
      if (isMagicProxyObject(value)) {
        return value
      }

      return createMagicProxy(value as T, options, { ...args, currentContext: id ?? args.currentContext })
    },
    /**
     * Proxy "set" trap for magic proxy.
     * Allows setting properties on the proxied object.
     * This will update the underlying target object.
     *
     * Note: it will not update if the property starts with __scalar_
     * Those will be considered private properties by the proxy
     */
    set(target, prop, newValue, receiver) {
      const ref = Reflect.get(target, REF_KEY, receiver)

      if (typeof prop === 'string' && prop.startsWith('__scalar_') && !options?.showInternal) {
        return true
      }

      if (prop === REF_VALUE && typeof ref === 'string' && ref !== '') {
        const id = getId(target)
        const path = convertToLocalRef(ref, id ?? args.currentContext, args.schemas)

        if (path === undefined) {
          return undefined
        }

        const segments = parseJsonPointerSegments(`/${path}`)

        if (segments.length === 0) {
          return false // Can not set top level $ref-value
        }

        // Get the parent node or create it if it does not exist
        const getParentNode = () => getValueByPath(args.root, segments.slice(0, -1)).value

        if (getParentNode() === undefined) {
          createPathFromSegments(args.root, segments.slice(0, -1))

          // In this case the ref is pointing to an invalid path, so we warn the user
          console.warn(
            `Trying to set $ref-value for invalid reference: ${ref}\n\nPlease fix your input file to fix this issue.`,
          )
        }

        // Set the value on the parent node
        getParentNode()[segments.at(-1)] = newValue
        return true
      }

      // Handle setting $ref-value for $dynamicRef nodes
      if (prop === REF_VALUE && (typeof ref !== 'string' || ref === '')) {
        const dynamicRef = Reflect.get(target, DYNAMIC_REF_KEY, receiver)
        if (typeof dynamicRef === 'string') {
          const anchorName = dynamicRef.startsWith('#') ? dynamicRef.substring(1) : dynamicRef
          const anchorPath = resolveDynamicAnchor(
            anchorName,
            args.dynamicScope,
            args.schemas.dynamicAnchors,
            getId(target) ?? args.currentContext,
          )
          if (anchorPath) {
            const segments = parseJsonPointerSegments(`/${anchorPath}`)
            if (segments.length > 0) {
              const parent = getValueByPath(args.root, segments.slice(0, -1)).value
              if (parent) {
                parent[segments.at(-1)] = newValue
                return true
              }
            }
          }
        }
        return false
      }

      return Reflect.set(target, prop, newValue, receiver)
    },
    /**
     * Proxy "deleteProperty" trap for magic proxy.
     * Allows deleting properties from the proxied object.
     * This will update the underlying target object.
     */
    deleteProperty(target, prop) {
      return Reflect.deleteProperty(target, prop)
    },
    /**
     * Proxy "has" trap for magic proxy.
     * - Pretend that "$ref-value" exists if "$ref" exists on the target.
     *   This allows expressions like `"$ref-value" in obj` to return true for objects with a $ref,
     *   even though "$ref-value" is a virtual property provided by the proxy.
     * - Hide properties starting with __scalar_ by returning false.
     * - For all other properties, defer to the default Reflect.has behavior.
     */
    has(target, prop) {
      // Hide properties starting with __scalar_
      if (typeof prop === 'string' && prop.startsWith('__scalar_') && !options?.showInternal) {
        return false
      }

      // Pretend that "$ref-value" exists if "$ref" exists
      if (prop === REF_VALUE && REF_KEY in target) {
        return true
      }
      // Also pretend "$ref-value" exists if "$dynamicRef" exists
      if (prop === REF_VALUE && DYNAMIC_REF_KEY in target) {
        return true
      }
      return Reflect.has(target, prop)
    },
    /**
     * Proxy "ownKeys" trap for magic proxy.
     * - Returns the list of own property keys for the proxied object.
     * - If the object has a "$ref" property, ensures that "$ref-value" is also included in the keys,
     *   even though "$ref-value" is a virtual property provided by the proxy.
     *   This allows Object.keys, Reflect.ownKeys, etc. to include "$ref-value" for objects with $ref.
     * - Filters out properties starting with __scalar_.
     */
    ownKeys(target) {
      const keys = Reflect.ownKeys(target)

      // Filter out properties starting with __scalar_
      const filteredKeys = keys.filter(
        (key) => typeof key !== 'string' || !(key.startsWith('__scalar_') && !options?.showInternal),
      )

      if (REF_KEY in target && !filteredKeys.includes(REF_VALUE)) {
        filteredKeys.push(REF_VALUE)
      }
      // Also include $ref-value if $dynamicRef exists (but $ref doesn't)
      if (!(REF_KEY in target) && DYNAMIC_REF_KEY in target && !filteredKeys.includes(REF_VALUE)) {
        filteredKeys.push(REF_VALUE)
      }
      return filteredKeys
    },

    /**
     * Proxy "getOwnPropertyDescriptor" trap for magic proxy.
     * - For the virtual "$ref-value" property, returns a descriptor that makes it appear as a regular property.
     * - Hide properties starting with __scalar_ by returning undefined.
     * - For all other properties, delegates to the default Reflect.getOwnPropertyDescriptor behavior.
     * - This ensures that Object.getOwnPropertyDescriptor and similar methods work correctly with the virtual property.
     */
    getOwnPropertyDescriptor(target, prop) {
      // Hide properties starting with __scalar_
      if (typeof prop === 'string' && prop.startsWith('__scalar_') && !options?.showInternal) {
        return undefined
      }

      const ref = Reflect.get(target, REF_KEY)

      if (prop === REF_VALUE && typeof ref === 'string' && ref !== '') {
        return {
          configurable: true,
          enumerable: true,
          value: undefined,
          writable: true,
        }
      }

      if (prop === REF_VALUE && (typeof ref !== 'string' || ref === '')) {
        const dynamicRef = Reflect.get(target, DYNAMIC_REF_KEY)
        if (typeof dynamicRef === 'string') {
          return {
            configurable: true,
            enumerable: true,
            value: undefined,
            writable: true,
          }
        }
      }

      // Otherwise, delegate to the default behavior
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
  }

  const proxied = new Proxy<T>(target, handler)
  if (args.dynamicScope.length > 0) {
    const scopeKey = args.dynamicScope.join(',')
    let targetScopes = args.scopeCache.get(target)
    if (!targetScopes) {
      targetScopes = new Map()
      args.scopeCache.set(target, targetScopes)
    }
    targetScopes.set(scopeKey, proxied)
  } else {
    args.proxyCache.set(target, proxied)
  }
  return proxied
}

const isMagicProxyObject = (obj: unknown): boolean => {
  return typeof obj === 'object' && obj !== null && (obj as { [isMagicProxy]: boolean })[isMagicProxy] === true
}

/**
 * Gets the raw (non-proxied) version of an object created by createMagicProxy.
 * This is useful when you need to access the original object without the magic proxy wrapper.
 *
 * @param obj - The magic proxy object to get the raw version of
 * @returns The raw version of the object
 * @example
 * const proxy = createMagicProxy({ foo: { $ref: '#/bar' } })
 * const raw = getRaw(proxy) // { foo: { $ref: '#/bar' } }
 */
export function getRaw<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if ((obj as T & { [isMagicProxy]: boolean | undefined })[isMagicProxy]) {
    return (obj as T & { [magicProxyTarget]: T })[magicProxyTarget]
  }

  return obj
}
