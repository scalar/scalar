import {
  collectDynamicAnchors as collectDynamicAnchorsGeneric,
  isDynamicRef as isDynamicRefGeneric,
  pushDynamicScope as pushDynamicScopeGeneric,
  resolveDynamicRef as resolveDynamicRefGeneric,
} from '@scalar/json-magic/magic-proxy'

import { unpackProxyObject } from '@/helpers/unpack-proxy'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'

/**
 * Resolution of JSON Schema 2020-12 `$dynamicRef` / `$dynamicAnchor`.
 *
 * The core resolver lives in `@scalar/json-magic` so the magic proxy can resolve `$dynamicRef`
 * transparently (via the virtual `$dynamicRef-value` property) while walking a document — consumers
 * that traverse the proxy never assemble the scope by hand. This module re-exports the same helpers
 * typed against `SchemaObject`, for the few callers that walk raw (unpacked) schemas and therefore
 * still thread the scope explicitly (e.g. the example builder). Proxies are unwrapped with the
 * workspace-store `unpackProxyObject`, which also strips override, detect-changes and Vue proxies, so
 * cycle detection stays correct across those layers. See https://github.com/scalar/scalar/issues/9414.
 */

/** The dynamic scope, ordered outermost-first (see the module docs and the generic resolver). */
export type DynamicScope = SchemaObject[]

/** Narrow a schema to one that carries a `$dynamicRef`. */
export const isDynamicRef = isDynamicRefGeneric as (schema: unknown) => schema is SchemaObject & { $dynamicRef: string }

/** Collect the `$dynamicAnchor` declarations of a single schema resource, keyed by anchor name. */
export const collectDynamicAnchors = (resource: SchemaObject): Map<string, SchemaObject> =>
  collectDynamicAnchorsGeneric(resource as Record<string, unknown>, (value: unknown) =>
    unpackProxyObject(value, { depth: 0 }),
  ) as Map<string, SchemaObject>

/** Append a schema to the dynamic scope when it could hold a `$dynamicAnchor`, otherwise return it unchanged. */
export const pushDynamicScope = (scope: DynamicScope, schema: SchemaObject): DynamicScope =>
  pushDynamicScopeGeneric(scope as Record<string, unknown>[], schema as Record<string, unknown>) as DynamicScope

/** Resolve a `$dynamicRef` fragment against the dynamic scope, outermost-first. */
export const resolveDynamicRef = (dynamicRef: string, scope: DynamicScope): SchemaObject | undefined =>
  resolveDynamicRefGeneric(dynamicRef, scope as Record<string, unknown>[], (value: unknown) =>
    unpackProxyObject(value, { depth: 0 }),
  ) as SchemaObject | undefined
