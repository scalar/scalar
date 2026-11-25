import { isObject } from '@scalar/helpers/object/is-object'
import {
  DYNAMIC_REF_VALUE,
  collectDynamicAnchors as collectDynamicAnchorsGeneric,
  createDynamicRefResolver,
  getRaw,
  isDynamicRef as isDynamicRefGeneric,
  pushDynamicScope as pushDynamicScopeGeneric,
  resolveDynamicRef as resolveDynamicRefGeneric,
} from '@scalar/json-magic/magic-proxy'

import { getBooleanSchema } from '@/helpers/get-boolean-schema'
import { followReferenceChain, getResolvedRef } from '@/helpers/get-resolved-ref'
import { unpackProxyShallow } from '@/helpers/unpack-proxy'
import type { MaybeRefSchemaObject, SchemaObject } from '@/schemas/v3.2/strict/schema'

/**
 * Resolution of JSON Schema 2020-12 `$dynamicRef` / `$dynamicAnchor`.
 *
 * The core resolver lives in `@scalar/json-magic` so the magic proxy can resolve `$dynamicRef`
 * transparently (via the virtual `$dynamicRef-value` property) while walking a document — consumers
 * that traverse the proxy never assemble the scope by hand. This module re-exports the same helpers
 * typed against `SchemaObject`, for the few callers that walk raw (unpacked) schemas and therefore
 * still thread the scope explicitly (e.g. the example builder). Proxies are unwrapped with the
 * workspace-store `unpackProxyShallow`, which also strips override, detect-changes and Vue proxies, so
 * cycle detection stays correct across those layers. See https://github.com/scalar/scalar/issues/9414.
 */

/**
 * Unwrap every proxy layer the store adds, for stable cycle-detection identity.
 *
 * Module-level on purpose: json-magic keys its anchor cache by this function, so a fresh closure per
 * call would never hit the cache.
 */
const unwrap = unpackProxyShallow

/** The dynamic scope, ordered outermost-first (see the module docs and the generic resolver). */
export type DynamicScope = SchemaObject[]

/** Narrow a schema to one that carries a `$dynamicRef`. */
export const isDynamicRef = isDynamicRefGeneric as (schema: unknown) => schema is SchemaObject & { $dynamicRef: string }

/** Collect the `$dynamicAnchor` declarations of a single schema resource, keyed by anchor name. */
export const collectDynamicAnchors = (resource: SchemaObject): Map<string, SchemaObject> =>
  collectDynamicAnchorsGeneric(resource as Record<string, unknown>, unwrap) as Map<string, SchemaObject>

/** Append a schema to the dynamic scope when it could hold a `$dynamicAnchor`, otherwise return it unchanged. */
export const pushDynamicScope = (scope: DynamicScope, schema: SchemaObject): DynamicScope => {
  const genericScope = scope as Record<string, unknown>[]
  // A schema reached through a `$ref` lives at the referenced location, outside any `$id` resource on
  // the path that led here, so its own anchors and `$defs` start a scope entry of their own.
  const withinExplicitResource = '$ref' in schema ? false : undefined
  const next = pushDynamicScopeGeneric(genericScope, schema as Record<string, unknown>, withinExplicitResource)
  if (next !== scope) {
    return next as DynamicScope
  }
  // Raw example generation may enter a named binding through a bare reference (#9883).
  const resolved = getResolvedRef(schema)
  return isObject(resolved) && resolved !== schema
    ? (pushDynamicScopeGeneric(genericScope, resolved, false) as DynamicScope)
    : scope
}

/** Resolve a `$dynamicRef` fragment against the dynamic scope, outermost-first. */
export const resolveDynamicRef = (dynamicRef: string, scope: DynamicScope): SchemaObject | undefined =>
  resolveDynamicRefGeneric(dynamicRef, scope as Record<string, unknown>[], unwrap) as SchemaObject | undefined

/** Resolve against the active proxy scope, even when schema coercion created a shallow view. */
export const createSchemaDynamicRefResolver = (
  root: SchemaObject,
): ((source: MaybeRefSchemaObject, scope: DynamicScope, view?: SchemaObject) => SchemaObject | undefined) => {
  const resolveDetached = createDynamicRefResolver(root, unwrap)
  return (source, scope, view) => {
    const resolved = isDynamicRef(source) ? source : followReferenceChain(source).value
    const schema = isDynamicRef(resolved) ? resolved : view
    if (!isDynamicRef(schema)) {
      return undefined
    }

    // An unresolved proxy reference already performed lexical resolution. Detached example schemas
    // can instead use their own root or the scope of a pre-resolved reference passed by the caller.
    const target =
      getRaw(schema) !== schema || Object.hasOwn(schema, DYNAMIC_REF_VALUE)
        ? Reflect.get(schema, DYNAMIC_REF_VALUE)
        : resolveDetached(schema, scope as Record<string, unknown>[])
    return typeof target === 'boolean'
      ? getBooleanSchema(target)
      : isObject(target)
        ? (target as SchemaObject)
        : undefined
  }
}
