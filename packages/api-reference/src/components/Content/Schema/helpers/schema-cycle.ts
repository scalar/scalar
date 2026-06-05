import type { InjectionKey } from 'vue'

/**
 * The set of schema "cycle keys" for every ancestor on the current render path.
 *
 * Each `Schema` component injects this set, adds its own key, and re-provides
 * it to its descendants. When a node's key is already present in the ancestor
 * set we've hit a cycle (a self-referential schema) and must stop force
 * expanding to avoid rendering forever.
 *
 * See {@link getCycleKey} for how a node's key is derived.
 */
export const SCHEMA_ANCESTORS_SYMBOL: InjectionKey<ReadonlySet<unknown>> = Symbol('schema-ancestors')

/**
 * Derive a stable identity for a schema node from its *raw* (unresolved) value.
 *
 * Cycle detection needs a key that is identical every time the same schema is
 * reached along a path, and that survives the shallow copies/merges performed
 * while rendering (which break object identity of the resolved schema).
 *
 * - For `$ref` nodes we use the ref string. Two branches that reference the
 *   same component share the string, so a schema that (transitively) references
 *   itself is detected as a cycle, while sibling references are not.
 * - For inline schemas there is no ref, so we fall back to the raw object
 *   reference. A self-referential inline schema reuses the same object, so
 *   object identity catches the cycle.
 *
 * Returns `undefined` for primitives/booleans (e.g. `additionalProperties: true`)
 * which can never form a cycle.
 */
export const getCycleKey = (raw: unknown): unknown => {
  if (raw && typeof raw === 'object') {
    if ('$ref' in raw && typeof (raw as { $ref?: unknown }).$ref === 'string') {
      return (raw as { $ref: string }).$ref
    }
    return raw
  }

  return undefined
}
