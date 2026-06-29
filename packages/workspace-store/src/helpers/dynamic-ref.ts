import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'

/**
 * Resolution of JSON Schema 2020-12 `$dynamicRef` / `$dynamicAnchor`.
 *
 * Unlike `$ref`, a `$dynamicRef` does not resolve to a fixed location. It is resolved against the
 * "dynamic scope" — the chain of schema resources entered to reach the reference. The same
 * `{ "$dynamicRef": "#itemType" }` inside a shared generic template therefore resolves to different
 * targets depending on which schema you entered through (e.g. `User` via `PaginatedUserResponse`,
 * `Group` via `PaginatedGroupResponse`). Because the result depends on the traversal path, resolution
 * cannot be pre-computed like `$ref`; it has to happen while walking the schema tree, with the scope
 * threaded through the walk. See https://github.com/scalar/scalar/issues/9414.
 */

/** A schema that may carry the JSON Schema 2020-12 `$defs` keyword (not part of the strict type). */
type SchemaWithDefs = SchemaObject & { $defs?: Record<string, SchemaObject> }

/**
 * The dynamic scope, ordered outermost-first.
 *
 * Each entry is a schema resource on the current evaluation path. When a `$dynamicRef` is resolved,
 * the outermost entry that declares a matching `$dynamicAnchor` wins.
 */
export type DynamicScope = SchemaObject[]

/** Narrow a schema to one that carries a `$dynamicRef`. */
export const isDynamicRef = (schema: unknown): schema is SchemaObject & { $dynamicRef: string } =>
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
const carriesDynamicAnchor = (schema: SchemaObject): boolean =>
  '$dynamicAnchor' in schema || '$id' in schema || '$defs' in (schema as SchemaWithDefs)

/**
 * Subschema-bearing keywords we descend into when collecting anchors. Covers the object, array and
 * applicator keywords a `$dynamicAnchor` can realistically sit under. Each entry says how to read the
 * child schema(s): a lone schema, an array of schemas, or a map of named schemas.
 */
const SUBSCHEMA_KEYWORDS = {
  schema: ['additionalProperties', 'propertyNames', 'items', 'contains', 'not', 'if', 'then', 'else'],
  list: ['allOf', 'anyOf', 'oneOf', 'prefixItems'],
  map: ['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'],
} as const

/**
 * Collect the `$dynamicAnchor` declarations of a single schema resource, keyed by anchor name.
 *
 * Anchors are collected anywhere inside the resource's inline structure — root, `$defs`, or nested under
 * `properties` / `allOf` / `items` / etc. — not just at the two shallow placements. Two boundaries keep
 * collection scoped to this resource: a nested `$id` starts a new schema resource (its anchors belong to
 * that resource, gathered when it is entered separately), and a `$ref` is not followed (the referenced
 * schema is collected at its own location). Each target is dereferenced so callers receive the concrete
 * schema the anchor points to. See https://github.com/scalar/scalar/issues/9414.
 */
const anchorCache = new WeakMap<object, Map<string, SchemaObject>>()

export const collectDynamicAnchors = (resource: SchemaObject): Map<string, SchemaObject> => {
  // Cache per raw schema object so repeated lookups during a walk stay cheap.
  const cacheTarget = unpackProxyObject(resource, { depth: 1 }) as object
  const cached = anchorCache.get(cacheTarget)
  if (cached) {
    return cached
  }

  const anchors = new Map<string, SchemaObject>()
  const seen = new WeakSet<object>()

  const visit = (node: SchemaObject | undefined, isRoot: boolean) => {
    if (!node || typeof node !== 'object') {
      return
    }

    // Guard against cycles in the inline schema graph using stable raw-object identity.
    const raw = unpackProxyObject(node, { depth: 0 }) as object
    if (seen.has(raw)) {
      return
    }
    seen.add(raw)

    // A nested `$id` starts a new schema resource; its anchors are collected when that resource is entered.
    if (!isRoot && '$id' in node) {
      return
    }

    const anchor = (node as { $dynamicAnchor?: unknown }).$dynamicAnchor
    if (typeof anchor === 'string' && !anchors.has(anchor)) {
      // Resolve any sibling `$ref` so the stored target is the concrete schema (e.g. `User`).
      anchors.set(anchor, getResolvedRef(node, mergeSiblingReferences) as SchemaObject)
    }

    // We descend into the node's own inline subschemas below, but never into a `$ref` target
    // (`$ref-value` is not a subschema keyword): the referenced schema is collected at its own location.
    const keyed = node as unknown as Record<string, unknown>
    for (const key of SUBSCHEMA_KEYWORDS.schema) {
      visit(keyed[key] as SchemaObject | undefined, false)
    }
    for (const key of SUBSCHEMA_KEYWORDS.list) {
      const list = keyed[key]
      if (Array.isArray(list)) {
        for (const child of list) {
          visit(child as SchemaObject, false)
        }
      }
    }
    for (const key of SUBSCHEMA_KEYWORDS.map) {
      const map = keyed[key]
      if (map && typeof map === 'object') {
        for (const child of Object.values(map as Record<string, SchemaObject>)) {
          visit(child, false)
        }
      }
    }
  }

  visit(resource, true)

  anchorCache.set(cacheTarget, anchors)
  return anchors
}

/** Append a schema to the dynamic scope when it could hold a `$dynamicAnchor`, otherwise return it unchanged. */
export const pushDynamicScope = (scope: DynamicScope, schema: SchemaObject): DynamicScope =>
  carriesDynamicAnchor(schema) ? [...scope, schema] : scope

/**
 * Resolve a `$dynamicRef` fragment against the dynamic scope.
 *
 * Scans the scope outermost-first and returns the first resource that declares a `$dynamicAnchor` with
 * the referenced name. Returns `undefined` when nothing matches, in which case callers should leave the
 * reference unresolved (the schema renders as it did before, with no regression).
 */
export const resolveDynamicRef = (dynamicRef: string, scope: DynamicScope): SchemaObject | undefined => {
  // Only plain-name fragments (`#itemType`) are supported; a non-fragment URI is not a dynamic anchor.
  const name = dynamicRef.startsWith('#') ? dynamicRef.slice(1) : undefined
  if (!name || name.startsWith('/')) {
    return undefined
  }

  for (const resource of scope) {
    const match = collectDynamicAnchors(resource).get(name)
    if (match) {
      return match
    }
  }

  return undefined
}
