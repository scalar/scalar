import { isDynamicRef } from '@scalar/workspace-store/helpers/dynamic-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Resolving JSON Schema 2020-12 `$dynamicRef` while rendering a schema.
 *
 * Unlike `$ref`, a `$dynamicRef` does not resolve to a fixed location: it binds to the active
 * `$dynamicAnchor` in the chain of schema resources entered to reach it, so the same
 * `{ "$dynamicRef": "#itemType" }` inside a shared generic template resolves to a different concrete
 * type depending on the path taken (e.g. `User` via a user page, `Group` via a group page).
 *
 * Resolution is owned by the workspace-store magic proxy, not by these components: the proxy threads the
 * dynamic scope as the document is walked and exposes the bound schema through the virtual
 * `$dynamicRef-value` property (mirroring `$ref-value`). Rendering simply reads that property, so the
 * scope never has to be assembled here. See https://github.com/scalar/scalar/issues/9414.
 */

/** The virtual property the magic proxy exposes to resolve a `$dynamicRef` against the active scope. */
const DYNAMIC_REF_VALUE = '$dynamicRef-value'

/**
 * Resolve a schema that may be a `$dynamicRef` to its bound concrete type.
 *
 * Returns the schema the proxy binds through `$dynamicRef-value`. When the reference cannot be resolved
 * — the schema is not a `$dynamicRef`, or has been detached from the proxy — the input is returned
 * unchanged, so rendering falls back to its prior behavior with no regression.
 */
export const resolveDynamicSchema = <T extends SchemaObject | undefined>(schema: T): T => {
  if (isDynamicRef(schema)) {
    return ((schema as Record<string, unknown>)[DYNAMIC_REF_VALUE] as T) ?? schema
  }

  return schema
}
