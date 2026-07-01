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
 * subschemas are skipped to keep the scope small.
 */
export const carriesDynamicAnchor = (schema: UnknownObject): boolean =>
  '$dynamicAnchor' in schema || '$id' in schema || '$defs' in schema

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
  return { ...(value as UnknownObject), ...rest }
}

const anchorCache = new WeakMap<object, Map<string, UnknownObject>>()

/**
 * Collect the `$dynamicAnchor` declarations of a single schema resource, keyed by anchor name.
 *
 * Anchors are collected anywhere inside the resource's inline structure — root, `$defs`, or nested under
 * `properties` / `allOf` / `items` / etc. Two boundaries keep collection scoped to this resource: a
 * nested `$id` starts a new schema resource (its anchors belong to that resource, gathered when it is
 * entered separately), and a `$ref` is not followed (the referenced schema is collected at its own
 * location). Each target is dereferenced so callers receive the concrete schema the anchor points to.
 *
 * @param resource - The schema resource to scan.
 * @param unwrap - Strips reactive/override/magic proxies so cycle detection and caching use stable
 *   raw-object identity. Defaults to the magic-proxy `getRaw`; workspace-store passes a fuller unpacker.
 * @see https://github.com/scalar/scalar/issues/9414
 */
export const collectDynamicAnchors = (resource: UnknownObject, unwrap: Unwrap = getRaw): Map<string, UnknownObject> => {
  // Cache per raw schema object so repeated lookups during a walk stay cheap.
  const cacheTarget = unwrap(resource) as object
  const cached = anchorCache.get(cacheTarget)
  if (cached) {
    return cached
  }

  const anchors = new Map<string, UnknownObject>()
  const seen = new WeakSet<object>()

  const visit = (node: unknown, isRoot: boolean) => {
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
 * Whether a document contains any `$dynamicRef` at all.
 *
 * The magic proxy uses this once, up front, as a gate: documents without dynamic references (the vast
 * majority) never grow a dynamic scope and never bypass the proxy cache, so their behavior is unchanged.
 * Only documents that actually use `$dynamicRef` pay for scope threading and path-dependent resolution.
 */
export const containsDynamicRef = (input: unknown, seen = new WeakSet<object>()): boolean => {
  if (!input || typeof input !== 'object') {
    return false
  }
  if (seen.has(input)) {
    return false
  }
  seen.add(input)

  if (!Array.isArray(input) && typeof (input as UnknownObject).$dynamicRef === 'string') {
    return true
  }

  for (const value of Object.values(input as UnknownObject)) {
    if (value && typeof value === 'object' && containsDynamicRef(value, seen)) {
      return true
    }
  }

  return false
}

/** Append a schema to the dynamic scope when it could hold a `$dynamicAnchor`, otherwise return it unchanged. */
export const pushDynamicScope = (scope: DynamicScope, schema: UnknownObject): DynamicScope =>
  carriesDynamicAnchor(schema) ? [...scope, schema] : scope

/**
 * Resolve a `$dynamicRef` fragment against the dynamic scope.
 *
 * Scans the scope outermost-first and returns the first resource that declares a `$dynamicAnchor` with
 * the referenced name. Returns `undefined` when nothing matches, in which case callers should leave the
 * reference unresolved (the schema renders as it did before, with no regression).
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

  for (const resource of scope) {
    const match = collectDynamicAnchors(resource, unwrap).get(name)
    if (match) {
      return match
    }
  }

  return undefined
}
