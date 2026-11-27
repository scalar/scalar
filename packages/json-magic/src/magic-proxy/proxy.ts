import { isObject } from '@scalar/helpers/object/is-object'

import {
  type DocumentReferences,
  bundledDocumentUri,
  documentReferences,
  resolveInitialDynamicRef,
} from '@/bundle/document-references'
import { getValueByPath } from '@/helpers/get-value-by-path'
import { createPathFromSegments } from '@/helpers/json-path-utils'
import { tryResolveResourcePath } from '@/helpers/resolve-resource-path'
import {
  type DynamicScope,
  type ScopeRole,
  carriesDynamicAnchor,
  collectDynamicAnchors,
  findDynamicAnchor,
  getChildScopeRole,
  resolveDynamicRef,
} from '@/magic-proxy/dynamic-ref'
import {
  DYNAMIC_REF_VALUE,
  dynamicAnchorCacheKey,
  getRaw,
  isMagicProxy,
  magicProxyRevision,
  magicProxyTarget,
} from '@/magic-proxy/symbols'
import type { UnknownObject } from '@/types'

const REF_VALUE = '$ref-value'
const REF_KEY = '$ref'
const DYNAMIC_REF_KEY = '$dynamicRef'
const REFERENCE_INDEX_KEYS = new Set([
  '$id',
  '$anchor',
  '$dynamicAnchor',
  '$schema',
  '$ref',
  'schemaFormat',
  'openapi',
  'swagger',
  'asyncapi',
  'x-scalar-document-type',
])

/** Index the document and bundled resources using the same bases as ordinary references. */
const indexReferences = (root: unknown, origin: string, includeCustomReferences = false): DocumentReferences => {
  const references = documentReferences('x-ext', undefined, false, undefined, undefined, undefined, {
    includeCustomReferences,
  })
  references.register(root, origin)
  if (isObject(root) && isObject(root['x-ext'])) {
    const mappings = root['x-ext-urls']
    for (const [key, document] of Object.entries(root['x-ext'])) {
      const source = isObject(mappings) && typeof mappings[key] === 'string' ? mappings[key] : undefined
      references.register(document, bundledDocumentUri(origin, key, source), ['x-ext', key])
    }
  }
  return references
}

/** Select the dynamic override only when the initial URI names a dynamic anchor. */
const resolveDynamicTarget = (
  initial: ReturnType<DocumentReferences['resolve']>,
  scope: DynamicScope,
  unwrap: (value: unknown) => unknown = getRaw,
  cacheKey?: { revision: number },
): unknown =>
  (initial?.dynamicAnchor ? findDynamicAnchor(initial.dynamicAnchor, scope, unwrap, cacheKey) : undefined) ??
  initial?.value

/** Index pre-resolved links as separate resources when the caller supplies a detached schema graph. */
const indexDetachedReferences = (root: object): DocumentReferences => {
  const references = indexReferences(root, '/')
  const seen = new WeakSet<object>()
  const pending: { node: object; role?: ScopeRole }[] = [{ node: root }]
  let linkCount = 0

  while (pending.length > 0) {
    const { node, role } = pending.pop()!
    if (role === 'data' || seen.has(node)) {
      continue
    }
    seen.add(node)
    const origin = references.origin(node)
    if (origin !== undefined && isObject(node) && typeof node.$ref === 'string' && Object.hasOwn(node, REF_VALUE)) {
      const target = node[REF_VALUE]
      if (isObject(target) && references.origin(target) === undefined) {
        const prefix = node.$ref.split('#', 1)[0]
        const retrievalUri = prefix ? tryResolveResourcePath(origin, prefix) : origin
        const path = [REF_VALUE, String(linkCount++)]
        if (retrievalUri !== undefined) {
          if (prefix && !resolveInitialDynamicRef(references, prefix, origin)) {
            references.register(target, retrievalUri, path)
          } else {
            references.registerFragment(target, {
              origin: retrievalUri,
              retrievalBase: retrievalUri,
              sourceUri: retrievalUri,
              path,
            })
          }
        }
        pending.push({ node: target })
      }
    }
    for (const key of Object.keys(node)) {
      const child: unknown = Reflect.get(node, key)
      if (key !== REF_VALUE && typeof child === 'object' && child !== null) {
        pending.push({ node: child, role: getChildScopeRole(role, key) })
      }
    }
  }

  return references
}

/**
 * Resolve dynamic references for a caller walking an unproxied schema.
 * Pre-resolved reference targets without a lexical location retain scope-based lookup.
 */
export const createDynamicRefResolver = (
  root: object,
  unwrap: (value: unknown) => unknown = getRaw,
): ((source: UnknownObject & { $dynamicRef: string }, scope: DynamicScope) => unknown) => {
  let references: DocumentReferences | undefined
  return (source, scope) => {
    references ??= indexDetachedReferences(root)
    const origin = references.origin(source)
    if (origin === undefined) {
      return resolveDynamicRef(source.$dynamicRef, scope, unwrap)
    }
    const initial = resolveInitialDynamicRef(references, source.$dynamicRef, origin)
    const lexicalScope = initial?.dynamicAnchor && scope[0] !== root && isObject(root) ? [root, ...scope] : scope
    return resolveDynamicTarget(initial, lexicalScope, unwrap)
  }
}

/**
 * Grow a dynamic scope by one resource, returning a stable (interned) array.
 *
 * The same `(parentScope, resource)` pair always yields the same array identity, so the scope can be
 * used as a WeakMap key for per-scope proxy caching. Without interning, every descent would allocate a
 * fresh scope array and the scope-keyed cache could never hit, defeating referential stability.
 */
const internScope = (
  cache: WeakMap<object, WeakMap<object, DynamicScope>>,
  parentScope: DynamicScope,
  resource: UnknownObject,
): DynamicScope => {
  let byResource = cache.get(parentScope)
  if (!byResource) {
    byResource = new WeakMap()
    cache.set(parentScope, byResource)
  }
  let child = byResource.get(resource)
  if (!child) {
    child = [...parentScope, resource]
    byResource.set(resource, child)
  }
  return child
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
  options?: Partial<{
    showInternal: boolean
    /** Canonical URI identifying the root document for qualified references. */
    documentUri: string
    /** Interpret custom reference positions using the same opt-in as the document bundler. */
    includeCustomReferences: boolean
  }>,
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
    proxyCache: WeakMap<
      object,
      { proxy: T; scopeRole?: ScopeRole; references: DocumentReferences; indexRevision: number }
    >
    /** Shared resource index for fragment pointers, identifiers, and anchors. */
    references: DocumentReferences
    origin: string
    /**
     * The JSON Schema 2020-12 dynamic scope on the current traversal path, outermost-first.
     *
     * Grown as we descend past schema resources that can hold a `$dynamicAnchor`, and used to resolve
     * the virtual `$dynamicRef-value` property. Stays empty until a resource with a dynamic anchor is entered.
     */
    dynamicScope: DynamicScope
    /** Keyword maps and instance data do not introduce schema resources. */
    scopeRole?: ScopeRole
    /** Refresh inherited scopes for proxies retained across schema edits. */
    getDynamicScope?: () => DynamicScope
    /**
     * Interns dynamic-scope arrays so the same `(parentScope, resource)` always yields the same array
     * identity. That stable identity is what makes the scope-keyed caches below work.
     */
    scopeCache: WeakMap<object, WeakMap<object, DynamicScope>>
    /**
     * Scope-keyed proxy cache used while a dynamic scope is active: one proxy per `(scope, target)`.
     *
     * `$dynamicRef` is path-dependent, so a target can bind differently under different scopes and the
     * plain `proxyCache` (one proxy per target) cannot be used. Keying by scope preserves referential
     * stability *within* a scope — which cycle detection and Vue rely on — while still returning distinct
     * proxies across scopes.
     *
     * There is no size cap or eviction: evicting a live entry would break identity on the next read.
     * Entries are created lazily for visited `(scope, target)` pairs. Both cache levels use weak keys,
     * so they do not retain a discarded document once its root and proxies are no longer reachable.
     */
    dynamicProxyCache: WeakMap<object, WeakMap<object, T>>
    /** Shared edit revision invalidating scoped proxies, anchor collections, and reference paths. */
    mutationState: {
      revision: number
      indexRevision: number
      dynamicIndex?: { revision: number; references: DocumentReferences }
    }
  } = (() => {
    const origin = options?.documentUri ?? '/'
    return {
      root: target,
      proxyCache: new WeakMap(),
      references: indexReferences(target, origin, options?.includeCustomReferences),
      origin,
      dynamicScope: [],
      scopeCache: new WeakMap(),
      dynamicProxyCache: new WeakMap(),
      mutationState: { revision: 0, indexRevision: 0 },
    }
  })(),
): T => {
  if (!isObject(target) && !Array.isArray(target)) {
    return target
  }

  const inheritedScope = args.dynamicScope
  const unscoped = inheritedScope.length === 0 ? args.proxyCache.get(target) : undefined
  const indexRevision = args.mutationState.indexRevision
  const currentReferences = args.mutationState.dynamicIndex?.references ?? args.references
  // A warm unscoped entry already ruled out a scope at this lexical position.
  if (
    unscoped &&
    unscoped.references === currentReferences &&
    unscoped.indexRevision === indexRevision &&
    unscoped.scopeRole === args.scopeRole
  ) {
    return unscoped.proxy
  }

  // The dynamic scope handed to child proxies: grow it by this resource when it can carry a
  // `$dynamicAnchor`. The cheap `carriesDynamicAnchor` check comes first so only candidate resources
  // (`$id`, `$defs`, or `$dynamicAnchor`) are scanned for anchors, and that scan is cached per resource.
  // There is deliberately no document-wide "uses `$dynamicRef`" probe: the store adds content to a live
  // document (lazy chunks, client edits), and a memoized negative answer would never see it.
  // The resource index tracks lexical ownership even when a schema is reached through a reference.
  // Grown scopes are interned so the same `(parentScope, resource)` yields one stable array identity.
  const getChildScope = (references: DocumentReferences, inheritedScope: DynamicScope): DynamicScope => {
    if (!(references.dynamicSchemaPosition(target) ?? !args.scopeRole)) {
      return inheritedScope
    }
    // A pointer can enter a subschema without visiting its enclosing resource root.
    const owner = references.schemaResource(references.origin(target) ?? args.origin)
    const resourceOwner =
      isObject(owner) &&
      (carriesDynamicAnchor(owner) || collectDynamicAnchors(owner, getRaw, args.mutationState).size > 0)
        ? owner
        : undefined
    const resource = resourceOwner ?? (target as UnknownObject)
    return (resourceOwner !== undefined || target === args.root || carriesDynamicAnchor(resource)) &&
      !inheritedScope.includes(resource) &&
      (inheritedScope.length > 0 || collectDynamicAnchors(resource, getRaw, args.mutationState).size > 0)
      ? internScope(args.scopeCache, inheritedScope, resource)
      : inheritedScope
  }

  let scopeRevision = indexRevision
  let scopeReferences = currentReferences
  let childScope = getChildScope(scopeReferences, inheritedScope)
  // While a dynamic scope is active, resolution is path-dependent: the same target can bind differently
  // depending on the path, so the plain one-proxy-per-target `proxyCache` cannot be used. Instead we key
  // proxies by `(scope, target)` — preserving referential stability within a scope (cycle detection and
  // Vue depend on it) while still returning distinct proxies across scopes. Ordinary documents never
  // grow a scope, so they keep using `proxyCache` unchanged.
  const initialScope = childScope
  const dynamicScopeActive = initialScope.length > 0

  // Return the existing proxy for this (scope, target) to ensure referential stability
  const scopedProxyCache = dynamicScopeActive ? args.dynamicProxyCache.get(initialScope) : undefined
  const existingProxy = scopedProxyCache?.get(target)
  if (existingProxy && Reflect.get(existingProxy, magicProxyRevision) === indexRevision) {
    return existingProxy
  }
  const existingUnscoped = dynamicScopeActive ? undefined : (unscoped ?? args.proxyCache.get(target))
  if (existingUnscoped) {
    if (existingUnscoped.scopeRole === args.scopeRole) {
      existingUnscoped.references = currentReferences
      existingUnscoped.indexRevision = indexRevision
    }
    return existingUnscoped.proxy
  }

  const getDynamicScope = (): DynamicScope => {
    const references = args.mutationState.dynamicIndex?.references ?? args.references
    if (scopeRevision !== args.mutationState.indexRevision || references !== scopeReferences) {
      childScope = getChildScope(references, args.getDynamicScope?.() ?? args.dynamicScope)
      scopeRevision = args.mutationState.indexRevision
      scopeReferences = references
    }
    return childScope
  }
  const getDynamicReferences = (): DocumentReferences => {
    const { indexRevision: revision, dynamicIndex } = args.mutationState
    if (revision === 0) {
      return args.references
    }
    if (dynamicIndex?.revision === revision) {
      return dynamicIndex.references
    }
    // Re-index lazily so edited identifiers and anchors get a fresh lexical lookup.
    const references = indexReferences(args.root, options?.documentUri ?? '/', options?.includeCustomReferences)
    args.mutationState.dynamicIndex = { revision, references }
    return references
  }
  const wrapReferenceTarget = (value: unknown, references: DocumentReferences): T => {
    if (isMagicProxyObject(value)) {
      return value as T
    }
    return createMagicProxy(value as T, options, {
      ...args,
      origin: isObject(value) ? (references.origin(value) ?? args.origin) : args.origin,
      dynamicScope: getDynamicScope(),
      scopeRole: undefined,
      getDynamicScope,
    })
  }
  const invalidate = (refreshReferences: boolean): void => {
    args.mutationState.revision++
    if (refreshReferences) {
      args.mutationState.indexRevision++
      args.mutationState.dynamicIndex = undefined
    }
  }
  const affectsReferenceIndex = (prop: string | symbol, previous: unknown, next: unknown): boolean =>
    typeof prop === 'string' &&
    (REFERENCE_INDEX_KEYS.has(prop) ||
      (options?.includeCustomReferences === true && prop === 'type') ||
      (Array.isArray(target) && prop === 'length') ||
      (previous !== null && typeof previous === 'object') ||
      (next !== null && typeof next === 'object') ||
      target === Reflect.get(args.root, 'x-ext') ||
      target === Reflect.get(args.root, 'x-ext-urls'))

  // Cache paths per proxy, never values: a raw target can be replaced between reads.
  let cached: { ref: string; origin: string; revision: number; segments: string[] } | undefined

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
      // Read this before refreshing scopes: anchor collection also asks proxy views for this key.
      if (prop === dynamicAnchorCacheKey) {
        return args.mutationState
      }
      if (prop === magicProxyRevision) {
        return indexRevision
      }
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

      if (prop === DYNAMIC_REF_VALUE) {
        const dynamicRef = Reflect.get(target, DYNAMIC_REF_KEY, receiver)
        if (typeof dynamicRef !== 'string') {
          return undefined
        }

        const references = getDynamicReferences()
        if (!(references.dynamicSchemaPosition(target) ?? !args.scopeRole)) {
          return undefined
        }
        const origin = references.origin(target) ?? args.origin
        const initial = resolveInitialDynamicRef(references, dynamicRef, origin)
        if (initial?.value === undefined) {
          return undefined
        }
        const resolved = resolveDynamicTarget(initial, getDynamicScope(), getRaw, args.mutationState)
        return isObject(resolved) || typeof resolved === 'boolean'
          ? wrapReferenceTarget(resolved, references)
          : undefined
      }

      // If accessing "$ref-value" and $ref is a local reference, resolve and return the referenced value
      if (prop === REF_VALUE && typeof ref === 'string') {
        const origin = args.references.origin(target) ?? args.origin
        if (cached?.ref !== ref || cached.origin !== origin || cached.revision !== args.mutationState.revision) {
          const resolved = args.references.resolve(ref, origin, true)
          if (!resolved) {
            return undefined
          }
          cached = { ref, origin, revision: args.mutationState.revision, segments: resolved.segments }
        }
        return wrapReferenceTarget(getValueByPath(args.root, cached.segments).value, args.references)
      }

      // For all other properties, recursively wrap the value in a magic proxy
      const value = Reflect.get(target, prop, receiver)

      // Return early if the value is already a magic proxy
      if (isMagicProxyObject(value)) {
        return value
      }

      if (!isObject(value) && !Array.isArray(value)) {
        return value
      }
      const scopeRole = getChildScopeRole(args.scopeRole, prop)
      return createMagicProxy(value as T, options, {
        ...args,
        origin: args.references.origin(target) ?? args.origin,
        dynamicScope: getDynamicScope(),
        scopeRole,
        getDynamicScope,
      })
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

      if (prop === REF_VALUE && typeof ref === 'string') {
        const segments = args.references.resolve(ref, args.references.origin(target) ?? args.origin, true)?.segments
        if (segments === undefined) {
          return undefined
        }

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
        const parent = getParentNode()
        const key = segments.at(-1)!
        if (key === '__proto__') {
          Object.defineProperty(parent, key, { value: newValue, enumerable: true, configurable: true, writable: true })
        } else {
          parent[key] = newValue
        }
        invalidate(true)
        return true
      }

      const previous = Reflect.get(target, prop, receiver)
      const updated = Reflect.set(target, prop, newValue, receiver)
      if (updated && previous !== newValue) {
        invalidate(affectsReferenceIndex(prop, previous, newValue))
      }
      return updated
    },
    /**
     * Proxy "deleteProperty" trap for magic proxy.
     * Allows deleting properties from the proxied object.
     * This will update the underlying target object.
     */
    deleteProperty(target, prop) {
      const descriptor = Reflect.getOwnPropertyDescriptor(target, prop)
      const deleted = Reflect.deleteProperty(target, prop)
      if (deleted && descriptor) {
        invalidate(Boolean(descriptor.get) || affectsReferenceIndex(prop, descriptor.value, undefined))
      }
      return deleted
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
      // Note: "$dynamicRef-value" is intentionally NOT surfaced here, in `ownKeys`, or in
      // `getOwnPropertyDescriptor`. It is a get-only virtual accessor: resolution is path-dependent, so
      // it must not leak into enumeration, spreads, coercion or serialization (which would embed a
      // resolved schema at the wrong scope). Consumers read it explicitly after an `isDynamicRef` check.
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

      if (prop === REF_VALUE && typeof ref === 'string') {
        return {
          configurable: true,
          enumerable: true,
          value: undefined,
          writable: false,
        }
      }

      // Otherwise, delegate to the default behavior
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
  }

  const proxied = new Proxy<T>(target, handler)
  // Cache the proxy for reuse. Under an active dynamic scope, key it by `(scope, target)` so the same
  // target reached again on the same path returns the same proxy (referential stability that cycle
  // detection and Vue rely on) while a different path — a different scope — gets its own proxy.
  if (dynamicScopeActive) {
    let scoped = args.dynamicProxyCache.get(initialScope)
    if (!scoped) {
      scoped = new WeakMap()
      args.dynamicProxyCache.set(initialScope, scoped)
    }
    scoped.set(target, proxied)
  } else {
    args.proxyCache.set(target, {
      proxy: proxied,
      scopeRole: args.scopeRole,
      references: currentReferences,
      indexRevision,
    })
  }
  return proxied
}

const isMagicProxyObject = (obj: unknown): boolean => {
  return typeof obj === 'object' && obj !== null && (obj as { [isMagicProxy]: boolean })[isMagicProxy] === true
}
