import { isObject } from './helpers/is-object'
import type { Schema } from './schema'
import type { Static } from './types'
import { validate } from './validate'

/**
 * How many object levels below a union node `scoreUnion` descends before it
 * stops scoring child values. Picking a union branch is a local decision, so
 * the shape near the union node is what matters. Scoring the whole subtree
 * made the cost grow as 2^depth on recursive unions (a few hundred bytes of
 * JSON could block the main thread for seconds). It also let a branch win
 * just because the value under it happened to be deep.
 *
 * Three is a safety margin, not a derived minimum. The existing
 * branch-selection tests only need the discriminator to be scored, which
 * happens at any depth.
 */
const MAX_VALUE_DEPTH = 3

/**
 * How many `lazy` nodes deep one scoring path may go before it returns a
 * neutral score. `lazy` is the only way to build an infinite schema, so this
 * stops schema cycles that never descend into a value, such as
 * `T = lazy(() => union([T, string()]))` scored against `'s'`.
 *
 * It limits depth, not fan-out. The in-progress guard only tracks objects, so
 * a schema cycle that branches over a primitive can still do a lot of work.
 * Only a schema author can build one of those, and the OpenAPI and AsyncAPI
 * schemas do not contain one.
 */
const MAX_LAZY_DEPTH = 64

/**
 * How many nested `coerceInner` calls one `coerce` call makes before it
 * stops and returns the remaining value unchanged. This has to fire before
 * the JavaScript stack overflows, or it does nothing. Without it, a deeply
 * nested document, or a schema cycle over a primitive such as
 * `lazy(() => union([T, string()]))`, throws a `RangeError`.
 *
 * Measured against the real OpenAPI Schema Object in Node, the stack
 * overflows at about 3,200 nested calls. That comes from 6 to 11 calls per
 * document level, depending on shape. We stop at roughly a third of that,
 * because browsers, web workers and the caller's own frames can leave less
 * stack. Schema Objects nested 90 to 165 levels deep still coerce fully.
 */
const MAX_COERCE_DEPTH = 1000

/**
 * Memoizes `schema.schema()` per lazy schema so that recursive definitions
 * such as `lazy(() => object({ child: lazy(() => T) }))` resolve to the same
 * inner schema reference across calls. Without this, every traversal would
 * synthesize a fresh inner schema, defeating the `(value, schema)` cycle
 * cache and producing infinite recursion on self-referential values.
 *
 * The cache is supplied by the top-level `coerce` call so it never leaks
 * resolved schemas between unrelated invocations.
 */
type LazyCache = WeakMap<object, Schema>
const resolveLazy = (schema: { schema: () => Schema }, lazyCache: LazyCache): Schema => {
  const cached = lazyCache.get(schema)
  if (cached) {
    return cached
  }
  const resolved = schema.schema()
  lazyCache.set(schema, resolved)
  return resolved
}

/**
 * True when this property schema is only used to discriminate union branches
 * (single literal, or a union of literals). No presence bonus when the value
 * does not match — avoids ties like `type: literal('a')` vs `type: union([lit('b'), lit('c')])`.
 */
const isDiscriminatorProperty = (schema: Schema): boolean => {
  if (schema.type === 'optional') {
    return isDiscriminatorProperty(schema.schema)
  }
  if (schema.type === 'literal') {
    return true
  }
  if (schema.type === 'union') {
    return schema.schemas.length > 0 && schema.schemas.every(isDiscriminatorProperty)
  }
  return false
}

/**
 * Computes a "score" indicating how well a value matches a schema,
 * used for picking the best branch in union coercion.
 *
 * Higher score means a closer match. Literals and matching object shapes
 * are weighted more heavily. Objects are scored by shape/literals;
 * arrays/records by structural type; primitives by validation; unions try all branches.
 *
 * The `scoringCache` tracks `(value, schema)` pairs that are currently being
 * scored higher up the call stack. Without it, a recursive lazy schema such as
 * `lazy(() => union([object({ child: optional(lazy(() => T)) }), …]))` scored
 * against a self-referential value would recurse forever through
 * `lazy → union → object → property → lazy → …` and overflow the stack.
 *
 * On re-entry of a pair we return `1` rather than `0` — a neutral positive
 * score consistent with `validateInner` short-circuiting cycles to `true`.
 * Markers are removed in `finally` so sibling union branches that share a
 * schema reference are scored independently rather than inheriting a stale
 * "in cycle" marker.
 *
 * The marker only stops *nested* re-entry. It does not stop the same pair
 * being scored again through a sibling path, so it cannot bound the work on
 * its own. Two budgets do that, each checked in the branch that uses it:
 * - `valueDepth` counts descents into object properties below the union node.
 *   Past {@link MAX_VALUE_DEPTH}, non-discriminator properties score a flat `1`
 *   and are not descended into.
 * - `lazyDepth` counts `lazy` nodes on the current path, capped at {@link MAX_LAZY_DEPTH}.
 *
 * Every schema node still runs its own type check at the cap. So an `object`
 * schema against a string still scores `0`, and the budgets only cut off
 * descent into child values.
 */
const scoreUnion = (
  schema: Schema,
  value: unknown,
  lazyCache: LazyCache,
  scoringCache: WeakMap<object, Set<Schema>> = new WeakMap(),
  valueDepth = 0,
  lazyDepth = 0,
): number => {
  // Short-circuit on cycles: this exact (value, schema) pair is already being
  // scored higher up the call stack. The enclosing call's score subsumes any
  // contribution we could compute here, so return a neutral positive score.
  if (isObject(value) && scoringCache.get(value)?.has(schema)) {
    return 1
  }

  const trackable = isObject(value)
  if (trackable) {
    const schemas = scoringCache.get(value) ?? new Set<Schema>()
    schemas.add(schema)
    scoringCache.set(value, schemas)
  }

  try {
    if (schema.type === 'object') {
      if (!isObject(value)) {
        return 0
      }

      const keys = Object.keys(schema.properties)

      // If there are no properties, we want to score 1 since we want to outscore if there are inline primitives
      if (keys.length === 0) {
        return 1
      }

      // Missing keys contribute 0 (including optional keys — matches prior union heuristics).
      // Discriminator properties (`literal` or `union` of literals): recurse with scoreUnion;
      // matching values get a high weight (×10) so `type: literal('A')` beats unrelated fields
      // on another branch; mismatches score 0 (no "key present" tie-break).
      // Other properties: scoreUnion plus +1 when the value fails validation so `{ a: null }`
      // can still prefer the branch that declares `a`.
      return keys.reduce<number>((acc, key) => {
        if (!(key in value)) {
          return acc
        }
        const propSchema = schema.properties[key]
        const raw = value[key as keyof typeof value]
        const isDiscriminator = isDiscriminatorProperty(propSchema)
        // Past the depth budget we stop descending into child values. Discriminators are still
        // scored in full: they are finite trees of literals, optionals and unions (never `lazy`)
        // that do not descend into the value, so this stays cheap. It also keeps a tag like
        // `kind: literal('b')` deciding the branch when it sits below the budget.
        const base =
          valueDepth >= MAX_VALUE_DEPTH
            ? isDiscriminator
              ? scoreUnion(propSchema, raw, lazyCache, scoringCache, valueDepth, lazyDepth)
              : 1
            : scoreUnion(propSchema, raw, lazyCache, scoringCache, valueDepth + 1, lazyDepth)
        if (isDiscriminator) {
          return acc + (base > 0 ? base * 10 : 0)
        }
        return acc + (base > 0 ? base : 1)
      }, 0)
    }
    if (schema.type === 'array') {
      // Score 1 if value is an array, otherwise 0
      return Array.isArray(value) ? 1 : 0
    }
    if (schema.type === 'record') {
      // TODO: implement smarter scoring for records (just a placeholder for now)
      return isObject(value) ? 1 : 0
    }
    if (schema.type === 'optional') {
      return value === undefined ? 1 : scoreUnion(schema.schema, value, lazyCache, scoringCache, valueDepth, lazyDepth)
    }
    if (schema.type === 'union') {
      // For a union, use the highest score among all sub-schemas
      return Math.max(
        ...schema.schemas.map((branch) => scoreUnion(branch, value, lazyCache, scoringCache, valueDepth, lazyDepth)),
      )
    }
    if (schema.type === 'intersection') {
      if (schema.schemas.length === 0) {
        return 1
      }
      return schema.schemas.reduce(
        (acc, sub) => acc + scoreUnion(sub, value, lazyCache, scoringCache, valueDepth, lazyDepth),
        0,
      )
    }

    if (schema.type === 'lazy') {
      // We cannot know the type without resolving, so a neutral score is the only option here.
      if (lazyDepth >= MAX_LAZY_DEPTH) {
        return 1
      }
      // For a lazy schema, evaluate the inner schema and recurse
      return scoreUnion(resolveLazy(schema, lazyCache), value, lazyCache, scoringCache, valueDepth, lazyDepth + 1)
    }

    if (schema.type === 'evaluate') {
      // For an evaluate schema, evaluate the expression and recurse. This spends no budget: the
      // inner `object` branch still stops descending at the cap, and `lazy` still bounds cycles.
      // Only a schema that points `evaluate` back at itself without a `lazy` in between could
      // loop, and the builders in `schema.ts` cannot construct one.
      return scoreUnion(schema.schema, schema.expression(value), lazyCache, scoringCache, valueDepth, lazyDepth)
    }

    // For primitives and any other type, return 1 if valid, otherwise 0
    return validate(schema, value) ? 1 : 0
  } finally {
    // Clear the in-progress marker so sibling union branches that reference
    // the same schema are scored independently rather than short-circuiting
    // to the cycle-neutral score.
    if (trackable) {
      scoringCache.get(value)?.delete(schema)
    }
  }
}

/**
 * Records the in-progress `result` for a given `(value, schema)` pair so that
 * recursive calls hitting the same pair return the already-allocated result
 * instead of recursing forever. Plain objects and arrays are both tracked;
 * other values cannot form cycles and are ignored.
 */
const trackCycle = (
  value: unknown,
  schema: Schema,
  result: unknown,
  cache: WeakMap<object, Map<Schema, unknown>>,
): void => {
  if (isObject(value) || Array.isArray(value)) {
    const schemas = cache.get(value) || new Map<Schema, unknown>()
    schemas.set(schema, result)
    cache.set(value, schemas)
  }
}

/**
 * The caches that already hit {@link MAX_COERCE_DEPTH}. We warn once per cache rather than once per
 * truncated subtree. Each `coerce` call gets its own cache unless the caller passes one in.
 */
const depthWarnings = new WeakSet<object>()

/**
 * Internal coercion implementation. Takes the wide `Schema` union and returns `unknown` so that
 * recursive calls do not pay the cost of relating two generic `Static<S>` instantiations, which
 * can overflow the type checker now that `LazyStatic` resolves recursive schemas without a depth
 * cap. The public `coerce` wrapper preserves the typed surface.
 */
const coerceInner = (
  schema: Schema,
  value: unknown,
  cache: WeakMap<object, Map<Schema, unknown>>,
  lazyCache: LazyCache,
  depth: number,
): unknown => {
  // Stop before the stack overflows. Return the value unchanged, not a schema default: callers
  // merge the result back into the document, so a default would overwrite real content. Leaving
  // the subtree un-normalized loses nothing.
  if (depth >= MAX_COERCE_DEPTH) {
    if (!depthWarnings.has(cache)) {
      depthWarnings.add(cache)
      console.warn(
        `[@scalar/validation] coerce stopped at nesting depth ${MAX_COERCE_DEPTH}; deeper values are left as-is.`,
      )
    }
    return value
  }

  // Prevent infinite recursion by returning the in-progress result that was
  // staged by an enclosing call via trackCycle.
  if ((isObject(value) || Array.isArray(value)) && cache.get(value)?.has(schema)) {
    return cache.get(value)?.get(schema)
  }

  // If no schema is provided, return the value as is
  if (!schema) {
    return value
  }

  if (schema.type === 'any' || schema.type === 'unknown') {
    return value
  }
  if (schema.type === 'function') {
    if (typeof value === 'function') {
      return value
    }
    return () => undefined
  }
  if (schema.type === 'number') {
    if (validate(schema, value)) {
      return value
    }
    return schema.default ?? 0
  }
  if (schema.type === 'string') {
    if (validate(schema, value)) {
      return value
    }
    return schema.default ?? ''
  }
  if (schema.type === 'boolean') {
    if (validate(schema, value)) {
      return value
    }
    return schema.default ?? false
  }
  if (schema.type === 'nullable') {
    return null
  }
  if (schema.type === 'notDefined') {
    return undefined
  }
  if (schema.type === 'optional') {
    if (value === undefined) {
      return undefined
    }
    return coerceInner(schema.schema, value, cache, lazyCache, depth + 1)
  }
  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      return []
    }
    // Pre-allocate so a self-referential array can be cached before we
    // recurse into its items, breaking otherwise-infinite cycles.
    const result: unknown[] = new Array(value.length)
    trackCycle(value, schema, result, cache)
    for (let i = 0; i < value.length; i++) {
      result[i] = coerceInner(schema.items, value[i], cache, lazyCache, depth + 1)
    }
    return result
  }
  if (schema.type === 'record') {
    if (!isObject(value)) {
      return {}
    }
    // Pre-allocate so a self-referential record can be cached before we
    // recurse into its entries, breaking otherwise-infinite cycles.
    const result: Record<string, unknown> = {}
    trackCycle(value, schema, result, cache)
    for (const key of Object.keys(value)) {
      result[key] = coerceInner(schema.value, value[key], cache, lazyCache, depth + 1)
    }
    return result
  }
  if (schema.type === 'object') {
    const keys = Object.keys(schema.properties)
    const target = isObject(value) ? value : null
    // Pre-allocate so a self-referential object can be cached before we
    // recurse into its properties, breaking otherwise-infinite cycles.
    const result: Record<string, unknown> = {}
    trackCycle(value, schema, result, cache)
    for (const key of keys) {
      const propSchema = schema.properties[key]
      const raw = target?.[key as keyof typeof target]
      if (propSchema.type === 'optional' && raw === undefined) {
        continue
      }
      result[key] = coerceInner(propSchema, raw, cache, lazyCache, depth + 1)
    }
    return result
  }
  if (schema.type === 'union') {
    const branch = schema.schemas.reduce(
      (acc, branchSchema) => {
        const score = scoreUnion(branchSchema, value, lazyCache)
        return score > acc.score ? { schema: branchSchema, score } : acc
      },
      { schema: schema.schemas[0]!, score: 0 },
    )
    // We need some way to pick one of the union values
    return coerceInner(branch.schema, value, cache, lazyCache, depth + 1)
  }
  if (schema.type === 'intersection') {
    return schema.schemas.reduce<Record<string, unknown>>(
      (acc, subSchema) =>
        Object.assign(acc, coerceInner(subSchema, value, cache, lazyCache, depth + 1) as Record<string, unknown>),
      {},
    )
  }
  if (schema.type === 'literal') {
    return schema.value
  }
  if (schema.type === 'lazy') {
    return coerceInner(resolveLazy(schema, lazyCache), value, cache, lazyCache, depth + 1)
  }
  if (schema.type === 'evaluate') {
    return coerceInner(schema.schema, schema.expression(value), cache, lazyCache, depth + 1)
  }

  // We need to assert here that schema has the type never so we know we handle all cases
  const _exhaustive: never = schema
  console.warn('Unknown schema type:', _exhaustive)
  return value
}

/**
 * Falls back to `any` when `S` widens all the way to the full `Schema` union and
 * returns the precise `Static<S>` otherwise. Computing `Static<Schema>` forces
 * TypeScript to expand every variant of the recursive `Schema` definition and
 * exhausts the depth limit, surfacing at call sites as
 * `TS2589: Type instantiation is excessively deep and possibly infinite`.
 * Degrading to `any` in that single case keeps the type tractable; callers that
 * pass a specific schema (for example an `intersection(...)` literal) still get
 * the precise static type.
 *
 * `[Schema] extends [S]` is wrapped in tuples to prevent distribution over union
 * members — we want a single check that the whole `Schema` union is assignable
 * to `S`, not a check that runs once per variant.
 */
type SafeStatic<S extends Schema> = [Schema] extends [S] ? any : Static<S>

/**
 * Coerces an unknown value toward the static type implied by `schema`. Values that
 * pass {@link validate} for that branch are kept; otherwise primitives default to
 * `0`, `''`, or `false`, and arrays, records, and objects are built recursively.
 * Unions pick the best-matching branch; `evaluate` runs `expression` before the inner schema.
 *
 * @example
 * ```ts
 * import { coerce, number, object, string } from '@scalar/validation'
 *
 * coerce(number(), 42) // 42
 * coerce(number(), 'nope') // 0 — invalid number uses default
 * coerce(object({ id: number(), name: string() }), { id: '1', name: 'Ada' }) // { id: 0, name: 'Ada' }
 * ```
 *
 * The optional `cache` argument tracks visited object–schema pairs to stop infinite recursion
 * on cyclic graphs; callers normally omit it.
 */
export const coerce = <S extends Schema>(
  schema: S,
  value: unknown,
  cache: WeakMap<object, Map<Schema, unknown>> = new WeakMap(),
  lazyCache: LazyCache = new WeakMap(),
): SafeStatic<S> => coerceInner(schema, value, cache, lazyCache, 0) as SafeStatic<S>
