import { isObject } from '@scalar/helpers/object/is-object'

import { getRaw } from '@/magic-proxy/proxy'
import type { UnknownObject } from '@/types'

/**
 * Resolution of JSON Schema 2020-12 `$dynamicRef` / `$dynamicAnchor`.
 *
 * Unlike `$ref`, a `$dynamicRef` does not resolve to a fixed location. It is resolved against the
 * "dynamic scope" — the chain of schema resources entered to reach the reference. The same
 * `{ "$dynamicRef": "#itemType" }` inside a shared generic template therefore resolves to different
 * targets depending on which schema you entered through (e.g. `User` via `PaginatedUserResponse`,
 * `Group` via `PaginatedGroupResponse`). Because the result depends on the traversal path, resolution
 * cannot be pre-computed like `$ref`; it has to happen while walking the schema tree, with the scope
 * threaded through the walk. The magic proxy threads that scope automatically (see `createMagicProxy`)
 * so consumers never assemble it by hand. See https://github.com/scalar/scalar/issues/9414.
 */

/** Unwrap a value to its raw target, used for stable identity in cycle guards and caches. */
type Unwrap = (value: unknown) => unknown

/**
 * The dynamic scope, ordered outermost-first.
 *
 * Each entry is a schema resource on the current evaluation path. When a `$dynamicRef` is resolved,
 * the outermost entry that declares a matching `$dynamicAnchor` wins.
 */
export type DynamicScope = UnknownObject[]

/** Narrow a value to a schema carrying a string `$dynamicRef`. */
export const isDynamicRef = (schema: unknown): schema is UnknownObject & { $dynamicRef: string } =>
  typeof schema === 'object' &&
  schema !== null &&
  '$dynamicRef' in schema &&
  typeof (schema as { $dynamicRef?: unknown }).$dynamicRef === 'string'

/**
 * Whether a schema introduces something a `$dynamicRef` could later bind to.
 *
 * We only grow the dynamic scope with schemas that could hold a `$dynamicAnchor`: those declaring one
 * directly, or resource boundaries (`$id`) / definition containers (`$defs`) that may hold one. Plain
 * subschemas are skipped to keep the scope small. Inside an explicit `$id` resource, inline anchors
 * and definition containers stay in that resource; only another `$id` grows the scope.
 *
 * @param withinExplicitResource - Whether the schema lives (lexically) inside a schema with `$id`. This
 *   is about where the schema is written, not the path that reached it: a schema reached through a
 *   `$ref` from inside an `$id` resource is not part of that resource.
 */
export const carriesDynamicAnchor = (schema: UnknownObject, withinExplicitResource = false): boolean =>
  '$id' in schema ||
  // Inline anchors and definition containers belong to their enclosing explicit resource.
  (!withinExplicitResource && ('$dynamicAnchor' in schema || '$defs' in schema))

/**
 * Subschema-bearing keywords we descend into when collecting anchors. Covers the object, array and
 * applicator keywords a `$dynamicAnchor` can realistically sit under. Each entry says how to read the
 * child schema(s): a lone schema, an array of schemas, or a map of named schemas.
 */
const SUBSCHEMA_KEYWORDS = {
  schema: [
    'additionalProperties',
    'unevaluatedProperties',
    'propertyNames',
    'items',
    'unevaluatedItems',
    'additionalItems',
    'contains',
    'contentSchema',
    'not',
    'if',
    'then',
    'else',
  ],
  list: ['allOf', 'anyOf', 'oneOf', 'prefixItems'],
  map: ['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'],
} as const

/**
 * Merge a sibling `$ref` onto its resolved target so callers receive the concrete schema.
 *
 * The magic proxy exposes the dereferenced target as the virtual `$ref-value` property. When an anchor
 * node also carries a `$ref` (e.g. `{ $dynamicAnchor: 'itemType', $ref: '#/…/User' }`), we merge the
 * wrapper's own keys over the resolved value — matching OpenAPI 3.1 semantics where siblings win.
 */
const dereferenceSiblingRef = (node: UnknownObject): UnknownObject => {
  if (!('$ref' in node) || !('$ref-value' in node)) {
    return node
  }

  const { '$ref-value': value, ...rest } = node
  // Only a schema object can be merged; spreading a string or array target would invent index keys.
  if (!isObject(value)) {
    return node
  }
  return { ...value, ...rest }
}

let anchorCaches = new WeakMap<Unwrap, WeakMap<object, Map<string, UnknownObject>>>()

/** Clear cached resource views after a document is edited through a magic proxy. */
export const clearDynamicAnchorCaches = (): void => {
  // Both raw and store-unwrapped views can depend on an edited descendant. Dropping the weak cache
  // avoids retaining or walking those views merely to track every ancestor dependency.
  anchorCaches = new WeakMap()
}

/**
 * Collect the `$dynamicAnchor` declarations of a single schema resource, keyed by anchor name.
 *
 * Anchors are collected anywhere inside the resource's inline structure — root, `$defs`, or nested under
 * `properties` / `allOf` / `items` / etc. Two boundaries keep collection scoped to this resource: a
 * nested `$id` starts a new schema resource (its anchors belong to that resource, gathered when it is
 * entered separately), and a `$ref` is not followed (the referenced schema is collected at its own
 * location). When an anchor binds through a sibling `$ref` that is already resolved (its `$ref-value` is
 * present), the target is dereferenced so callers receive the concrete schema; otherwise the anchor node
 * is returned as-is and the caller resolves the `$ref` (as the magic proxy does on access).
 *
 * @param resource - The schema resource to scan.
 * @param unwrap - Strips reactive/override/magic proxies so cycle detection uses stable
 *   raw-object identity. Defaults to the magic-proxy `getRaw`; workspace-store passes a fuller unpacker.
 * @see https://github.com/scalar/scalar/issues/9414
 */
export const collectDynamicAnchors = (resource: UnknownObject, unwrap: Unwrap = getRaw): Map<string, UnknownObject> => {
  // Callers can expose different resolved values for the same raw resource. Keep
  // both the traversal mode and the resource view isolated to avoid leaking a
  // scoped proxy or a dereferenced sibling into another caller's resolution.
  let anchorCache = anchorCaches.get(unwrap)
  if (!anchorCache) {
    anchorCache = new WeakMap()
    anchorCaches.set(unwrap, anchorCache)
  }
  const cacheTarget = resource
  const cached = anchorCache.get(cacheTarget)
  if (cached) {
    return cached
  }

  const anchors = new Map<string, UnknownObject>()
  const seen = new WeakSet<object>()

  const visit = (node: unknown, isRoot: boolean): void => {
    if (!node || typeof node !== 'object') {
      return
    }

    // Guard against cycles in the inline schema graph using stable raw-object identity.
    const raw = unwrap(node) as object
    if (seen.has(raw)) {
      return
    }
    seen.add(raw)

    const keyed = node as UnknownObject

    // A nested `$id` starts a new schema resource; its anchors are collected when that resource is entered.
    if (!isRoot && '$id' in keyed) {
      return
    }

    const anchor = keyed.$dynamicAnchor
    if (typeof anchor === 'string' && !anchors.has(anchor)) {
      // Resolve any sibling `$ref` so the stored target is the concrete schema (e.g. `User`).
      anchors.set(anchor, dereferenceSiblingRef(keyed))
    }

    // Descend into the node's own inline subschemas, but never into a `$ref` target (`$ref-value` is not
    // a subschema keyword): the referenced schema is collected at its own location.
    for (const key of SUBSCHEMA_KEYWORDS.schema) {
      visit(keyed[key], false)
    }
    for (const key of SUBSCHEMA_KEYWORDS.list) {
      const list = keyed[key]
      if (Array.isArray(list)) {
        for (const child of list) {
          visit(child, false)
        }
      }
    }
    for (const key of SUBSCHEMA_KEYWORDS.map) {
      const map = keyed[key]
      if (map && typeof map === 'object') {
        for (const child of Object.values(map)) {
          visit(child, false)
        }
      }
    }
  }

  visit(resource, true)

  anchorCache.set(cacheTarget, anchors)
  return anchors
}

/**
 * Append a schema to the dynamic scope when it could hold a `$dynamicAnchor`, otherwise return it unchanged.
 *
 * Callers that walk the tree lexically can omit `withinExplicitResource`: it then defaults to whether an
 * explicit `$id` resource is already in scope. Pass `false` for a schema reached through a `$ref`.
 */
export const pushDynamicScope = (
  scope: DynamicScope,
  schema: UnknownObject,
  withinExplicitResource = scope.some((resource) => '$id' in resource),
): DynamicScope => (carriesDynamicAnchor(schema, withinExplicitResource) ? [...scope, schema] : scope)

/**
 * Resolve a `$dynamicRef` fragment against the dynamic scope.
 *
 * Follows the JSON Schema 2020-12 "bookending" rule: a `$dynamicRef` only resolves dynamically when the
 * schema resource it sits in *also* declares a matching `$dynamicAnchor` — the "bookend" default. That
 * resource starts at the innermost scope entry with an `$id` and includes every entry after it; when no
 * entry has an `$id`, the whole scope belongs to the document's own resource. Entries pushed only for
 * `$defs` or an inline `$dynamicAnchor` are not resource boundaries, so they cannot hide a bookend that
 * the enclosing resource declares. Without the bookend, `$dynamicRef` degrades to a plain `$ref` and must
 * not borrow an unrelated anchor from an outer resource. With the bookend present, the scope is scanned outermost-first
 * and the first resource declaring a matching `$dynamicAnchor` wins (worst case, the bookend itself).
 *
 * Returns `undefined` when the reference cannot be bound, in which case callers should leave it unresolved
 * (the schema renders as it did before, with no regression).
 */
export const resolveDynamicRef = (
  dynamicRef: string,
  scope: DynamicScope,
  unwrap: Unwrap = getRaw,
): UnknownObject | undefined => {
  // Only plain-name fragments (`#itemType`) are supported; a non-fragment URI is not a dynamic anchor.
  const name = dynamicRef.startsWith('#') ? dynamicRef.slice(1) : undefined
  if (!name || name.startsWith('/')) {
    return undefined
  }

  // Bookending: the resource holding the reference must declare the anchor, otherwise there is no
  // dynamic binding and we leave the reference unresolved.
  let resourceStart = scope.length - 1
  while (resourceStart > 0 && !('$id' in (scope[resourceStart] ?? {}))) {
    resourceStart--
  }
  const holdingResource = scope.slice(resourceStart)
  if (!holdingResource.some((resource) => collectDynamicAnchors(resource, unwrap).has(name))) {
    return undefined
  }

  for (const resource of scope) {
    const match = collectDynamicAnchors(resource, unwrap).get(name)
    if (match) {
      return match
    }
  }

  return undefined
}
