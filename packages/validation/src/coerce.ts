import { isObject } from './helpers/is-object'
import type { Schema } from './schema'
import type { Static } from './types'
import { validate } from './validate'

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

/** Ancestor checks that must still hold when a cycle-dependent score is reused. */
type ScoreDependencies = {
  active: bigint
  inactive: bigint
}

/** Tracks one object/schema pair for the lifetime of a coercion call. */
type ScoringPair = {
  active: boolean
  bit?: bigint
  completed?: number
  contextual?: { score: number; dependencies: ScoreDependencies }
}

/** Records only ancestor checks that influence cycle-dependent scores. */
type ScoringFrame = {
  cyclic: boolean
  dependencies: ScoreDependencies
}

/**
 * Scores are shared only within one coercion call. Evaluate expressions must return stable results
 * without mutating their input during scoring; completed scores assume unchanged value/schema pairs.
 * coerceInner constructs result containers instead of mutating inputs, making reuse sound for the
 * whole call. Keep this context per-call even when callers supply their own output/lazy caches.
 */
type ScoringContext = {
  pairs: WeakMap<object, Map<Schema, ScoringPair>>
  active: bigint
  nextBit: bigint
  memoizationDisabled: boolean
  frame?: ScoringFrame
}

/** Bound mask storage and bitwise work even when a call visits many independent cycles. */
const dependencyBitLimit = 1n << 1024n

/**
 * Assign bits only to cycle-dependent pairs so ordinary acyclic data does not build a growing bitset.
 * Compact masks avoid repeatedly copying ancestor maps while scoring larger rings.
 */
const dependencyBit = (pair: ScoringPair, scoring: ScoringContext): bigint => {
  if (scoring.memoizationDisabled) {
    return 0n
  }
  if (pair.bit === undefined) {
    if (scoring.nextBit === dependencyBitLimit) {
      // Do not cache partially recorded dependencies, including frames already on the stack.
      scoring.memoizationDisabled = true
      return 0n
    }
    pair.bit = scoring.nextBit
    scoring.nextBit <<= 1n
    if (pair.active) {
      scoring.active |= pair.bit
    }
  }
  return pair.bit
}

/**
 * Both positive and negative checks matter: another ancestor becoming active can cut a previously
 * completed traversal short, even when the ancestor that originally broke its cycle is unchanged.
 */
const propagateDependencies = (frame: ScoringFrame | undefined, dependencies: ScoreDependencies): void => {
  if (frame) {
    frame.cyclic = true
    frame.dependencies.active |= dependencies.active
    frame.dependencies.inactive |= dependencies.inactive
  }
}

/**
 * Acyclic scores can be reused directly. Cyclic scores record the ancestor checks that affected them,
 * so equivalent paths through union alternatives share work without changing their branch scores.
 * Keep only the latest cyclic result per pair; accumulating every context would grow the cache.
 */
const scoreUnion = (schema: Schema, value: unknown, lazyCache: LazyCache, scoring: ScoringContext): number => {
  if (!isObject(value)) {
    return scoreUnionInner(schema, value, lazyCache, scoring)
  }

  const schemas = scoring.pairs.get(value) ?? new Map<Schema, ScoringPair>()
  const pair = schemas.get(schema) ?? { active: false }
  schemas.set(schema, pair)
  scoring.pairs.set(value, schemas)

  if (pair.active) {
    if (scoring.frame) {
      scoring.frame.cyclic = true
      scoring.frame.dependencies.active |= dependencyBit(pair, scoring)
    }
    return 1
  }
  if (!scoring.memoizationDisabled && pair.completed !== undefined) {
    return pair.completed
  }

  const cached = pair.contextual
  if (
    !scoring.memoizationDisabled &&
    cached &&
    (scoring.active & cached.dependencies.active) === cached.dependencies.active &&
    (scoring.active & cached.dependencies.inactive) === 0n
  ) {
    propagateDependencies(scoring.frame, cached.dependencies)
    return cached.score
  }

  const parent = scoring.frame
  const frame: ScoringFrame = { cyclic: false, dependencies: { active: 0n, inactive: 0n } }
  scoring.frame = frame
  pair.active = true
  if (pair.bit !== undefined) {
    scoring.active |= pair.bit
  }

  try {
    const score = scoreUnionInner(schema, value, lazyCache, scoring)
    if (scoring.memoizationDisabled) {
      return score
    }
    if (frame.cyclic) {
      // This frame activates its own pair internally, but a caller must enter with that pair inactive.
      const bit = dependencyBit(pair, scoring)
      if (scoring.memoizationDisabled) {
        return score
      }
      frame.dependencies.active &= ~bit
      frame.dependencies.inactive |= bit
      pair.contextual = { score, dependencies: frame.dependencies }
      propagateDependencies(parent, frame.dependencies)
    } else {
      pair.completed = score
    }
    return score
  } finally {
    pair.active = false
    if (pair.bit !== undefined) {
      scoring.active &= ~pair.bit
    }
    scoring.frame = parent
  }
}

/** Computes branch scores using the existing shape and discriminator weights. */
const scoreUnionInner = (schema: Schema, value: unknown, lazyCache: LazyCache, scoring: ScoringContext): number => {
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
      const base = scoreUnion(propSchema, raw, lazyCache, scoring)
      if (isDiscriminatorProperty(propSchema)) {
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
    return value === undefined ? 1 : scoreUnion(schema.schema, value, lazyCache, scoring)
  }
  if (schema.type === 'union') {
    // For a union, use the highest score among all sub-schemas
    return Math.max(...schema.schemas.map((branch) => scoreUnion(branch, value, lazyCache, scoring)))
  }
  if (schema.type === 'intersection') {
    if (schema.schemas.length === 0) {
      return 1
    }
    return schema.schemas.reduce((acc, sub) => acc + scoreUnion(sub, value, lazyCache, scoring), 0)
  }

  if (schema.type === 'lazy') {
    // For a lazy schema, evaluate the inner schema and recurse
    return scoreUnion(resolveLazy(schema, lazyCache), value, lazyCache, scoring)
  }

  if (schema.type === 'evaluate') {
    // For an evaluate schema, evaluate the expression and recurse
    return scoreUnion(schema.schema, schema.expression(value), lazyCache, scoring)
  }

  // For primitives and any other type, return 1 if valid, otherwise 0
  return validate(schema, value) ? 1 : 0
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
  scoring: ScoringContext,
): unknown => {
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
    return coerceInner(schema.schema, value, cache, lazyCache, scoring)
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
      result[i] = coerceInner(schema.items, value[i], cache, lazyCache, scoring)
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
      result[key] = coerceInner(schema.value, value[key], cache, lazyCache, scoring)
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
      result[key] = coerceInner(propSchema, raw, cache, lazyCache, scoring)
    }
    return result
  }
  if (schema.type === 'union') {
    const branch = schema.schemas.reduce(
      (acc, branchSchema) => {
        const score = scoreUnion(branchSchema, value, lazyCache, scoring)
        return score > acc.score ? { schema: branchSchema, score } : acc
      },
      { schema: schema.schemas[0]!, score: 0 },
    )
    // We need some way to pick one of the union values
    return coerceInner(branch.schema, value, cache, lazyCache, scoring)
  }
  if (schema.type === 'intersection') {
    return schema.schemas.reduce<Record<string, unknown>>(
      (acc, subSchema) =>
        Object.assign(acc, coerceInner(subSchema, value, cache, lazyCache, scoring) as Record<string, unknown>),
      {},
    )
  }
  if (schema.type === 'literal') {
    return schema.value
  }
  if (schema.type === 'lazy') {
    return coerceInner(resolveLazy(schema, lazyCache), value, cache, lazyCache, scoring)
  }
  if (schema.type === 'evaluate') {
    return coerceInner(schema.schema, schema.expression(value), cache, lazyCache, scoring)
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
): SafeStatic<S> =>
  coerceInner(schema, value, cache, lazyCache, {
    pairs: new WeakMap(),
    active: 0n,
    nextBit: 1n,
    memoizationDisabled: false,
  }) as SafeStatic<S>
