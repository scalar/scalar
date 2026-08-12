import { isObject } from '@scalar/helpers/object/is-object'

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
 * Collect the `$dynamicAnchor` declarations of a single schema resource, keyed by anchor name.
 *
 * Anchors are looked for at the resource root and inside `$defs` — the two placements used by the
 * common generic and recursive patterns. Anchors nested deeper are not collected (a documented v1
 * limitation). Each target is dereferenced so callers receive the concrete schema the anchor points to.
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

  const add = (node: SchemaObject | undefined) => {
    if (!node || typeof node !== 'object') {
      return
    }
    const anchor = (node as { $dynamicAnchor?: unknown }).$dynamicAnchor
    if (typeof anchor === 'string' && !anchors.has(anchor)) {
      // Resolve any sibling `$ref` so the stored target is the concrete schema (e.g. `User`).
      anchors.set(anchor, getResolvedRef(node, mergeSiblingReferences) as SchemaObject)
    }
  }

  add(resource)

  const defs = (resource as SchemaWithDefs).$defs
  if (defs && typeof defs === 'object') {
    for (const key of Object.keys(defs)) {
      add(defs[key])
    }
  }

  anchorCache.set(cacheTarget, anchors)
  return anchors
}

/**
 * Append a schema resource to the dynamic scope when it could hold a `$dynamicAnchor`.
 *
 * A schema that carries the binding inline — its own `$dynamicAnchor`, or the `$id`/`$defs` binding
 * written next to a `$ref` (how `Paginated<Planet>` is expressed) — enters the scope directly. A bare
 * `$ref` to a *named* binding resource (e.g. `$ref: '#/components/schemas/PaginatedUserResponse'`)
 * hides that resource's `$id`/`$defs` behind the ref, so the anchor is invisible here; follow the ref
 * to reach the resource. Ordinary `$ref`s resolve to a schema without an anchor and are still skipped;
 * an unresolved `$ref` resolves to `undefined` and is skipped too.
 *
 * See https://github.com/scalar/scalar/issues/9883.
 */
export const pushDynamicScope = (scope: DynamicScope, schema: SchemaObject): DynamicScope => {
  const resource = carriesDynamicAnchor(schema) ? schema : getResolvedRef(schema)
  return isObject(resource) && carriesDynamicAnchor(resource) ? [...scope, resource] : scope
}

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
