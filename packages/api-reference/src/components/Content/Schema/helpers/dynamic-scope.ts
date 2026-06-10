import { type DynamicScope, isDynamicRef, resolveDynamicRef } from '@scalar/workspace-store/helpers/dynamic-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { type InjectionKey, inject } from 'vue'

/**
 * The dynamic scope — the outermost-first chain of schema resources on the current render path.
 *
 * JSON Schema 2020-12 `$dynamicRef` does not resolve to a fixed location. It binds to the active
 * `$dynamicAnchor` in the chain of resources entered to reach it, so the same
 * `{ "$dynamicRef": "#itemType" }` inside a shared generic template resolves to a different concrete
 * type depending on the path taken (e.g. `User` via a user page, `Group` via a group page).
 *
 * Each object `Schema` node injects this scope, appends its own resource, and re-provides it to its
 * descendants. `SchemaProperty` reads it to bind a `$dynamicRef` property or array item to the
 * concrete schema while walking the tree. See https://github.com/scalar/scalar/issues/9414.
 */
export const SCHEMA_DYNAMIC_SCOPE_SYMBOL: InjectionKey<DynamicScope> = Symbol('schema-dynamic-scope')

/** Shared empty scope used as the inject default at the root, where nothing has been entered yet. */
const EMPTY_SCOPE: DynamicScope = []

/** Read the dynamic scope provided by ancestor schema nodes (empty at the root of the tree). */
export const useDynamicScope = (): DynamicScope => inject(SCHEMA_DYNAMIC_SCOPE_SYMBOL, EMPTY_SCOPE)

/**
 * Resolve a schema that may be a `$dynamicRef` against the active dynamic scope.
 *
 * Returns the bound concrete schema when the reference matches a `$dynamicAnchor` in scope. When
 * nothing matches (or the schema is not a `$dynamicRef`) the input is returned unchanged, so
 * rendering falls back to its prior behavior with no regression.
 */
export const resolveDynamicSchema = <T extends SchemaObject | undefined>(schema: T, scope: DynamicScope): T => {
  if (isDynamicRef(schema)) {
    return (resolveDynamicRef(schema.$dynamicRef, scope) as T) ?? schema
  }

  return schema
}
