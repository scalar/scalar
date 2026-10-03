import { isObject } from './helpers/is-object'
import type { Schema } from './schema'

/**
 * Per-call bookkeeping for {@link validateInner}. A fresh state is created for every top-level
 * {@link validate} call, never at module scope: values are mutable, so a result remembered from an
 * earlier call could be stale.
 */
type ValidationState = {
  /**
   * What is known about each `(object, schema)` pair. {@link IN_FLIGHT} means the pair is being
   * validated further up the call stack, so reaching it again means the value graph has a cycle,
   * or the schema loops back to itself on the same object, and the call short-circuits to `true`. A boolean is a finished, memoized result of a `lazy`
   * node. Without the memo, a value reachable through more than one branch (for example an
   * undiscriminated recursive union) is validated again once per branch at every level, which
   * takes exponential time in the nesting depth.
   */
  results: WeakMap<object, Map<Schema, boolean | typeof IN_FLIGHT>>
  /** Pairs a caller passed in as already being validated. They short-circuit like {@link IN_FLIGHT}. */
  callerInFlight: WeakMap<object, Set<Schema>> | undefined
  /**
   * Whether the frame being validated, or anything below it, short-circuited on an in-flight pair
   * (a value cycle, or a schema looping back to itself on the same object).
   * Such a result depends on which pairs happen to be in flight, not only on `(value, schema)`,
   * so it must not be memoized.
   */
  tainted: boolean
}

/** Marks an `(object, schema)` pair in {@link ValidationState.results} as still being validated. */
const IN_FLIGHT = Symbol('in flight')

/**
 * How many steps a value that is not an object or array may take through `union`, `optional`,
 * `lazy` and `evaluate` nodes before {@link validateInner} starts recording them to catch loops.
 *
 * Each frame that reaches this many steps starts its own record, so a schema that loops back to
 * itself through k branches every L steps is explored about k^(8/L) times before loops are caught.
 * Real schemas do not loop on primitives like that, so the extra work only shows up in contrived ones.
 */
const UNTRACKED_HOPS = 8

/** Stands in for `-0` in the reachability search, where a `Map` would mix it up with `0`. */
const NEGATIVE_ZERO = Symbol('-0')

/**
 * Turns a value into its key in the reachability search. A `Map` treats `0` and `-0` as the same
 * key, but an `evaluate` expression can tell them apart, so they must be recorded separately.
 */
const searchKey = (value: unknown): unknown => (Object.is(value, -0) ? NEGATIVE_ZERO : value)

/**
 * Internal validation implementation.
 *
 * Objects and arrays can form cycles, so `(value, schema)` pairs that are in flight are tracked in
 * `state.results`. Re-entering a pair that is already being validated higher up the stack
 * short-circuits to `true`: any concrete mismatch would surface at that enclosing call rather than
 * via the cycle. Before the call returns, the marker is replaced by the result or removed, so a
 * marker only ever describes the live call stack. A stale marker left by a failed branch (for
 * example the first member of a `union`) would look like a cycle to later sibling branches.
 *
 * Finished results of `lazy` frames are memoized in the same map, but only when the frame never
 * hit that cycle short-circuit (see {@link ValidationState.tainted}). Only `lazy` frames, because
 * recursion always goes through one, and a shared `lazy` node (like `const T = lazy(() => ...)`) is
 * the one schema object that stays the same between visits. A factory usually builds its schema
 * inline, so everything below it is a fresh object on every expansion, and remembering those would
 * only fill the map with keys that are never looked up again. For the same reason, a factory that
 * creates a new `lazy` node on each expansion gets no benefit from the memo. The short-circuit
 * needs a value that leads back to itself, or a schema that recurses on the same object without
 * looking inside it, so a parsed JSON document checked against a real schema is fully memoized.
 * Anything that did hit it is validated again when reached, just like before the memo existed.
 *
 * Primitives (and other values that are not plain objects or arrays) cannot form cycles, but a
 * schema can: `T = lazy(() => union([T, string()]))` keeps asking whether `7` matches `T`. On such
 * a value only `union`, `optional`, `lazy` and `evaluate` recurse, and all of them just pass the
 * answer of what they recurse into up, or combine answers with "or". So from the first primitive
 * until the next object or array, validation is a plain reachability search: does some path lead
 * to a leaf that matches? `visited` records the `(value, node)` pairs that search has reached, and
 * reaching one again returns `false`. That is exact rather than a cut-off. A pair already on the
 * path is a loop, which can never be the reason a value matches. A pair that already finished
 * returned `false`, because a `true` would have ended the whole search. So the answer is the one
 * found along the other paths, and each pair is looked at once.
 *
 * Almost every such chain is short, like an `optional(string())` on a string, so the search only
 * starts recording after {@link UNTRACKED_HOPS} steps. A loop just runs that many extra steps
 * before it is caught. That keeps ordinary checks free of allocations.
 *
 * The search starts over whenever an object or array is entered, because `object`, `array`,
 * `record` and `intersection` combine answers with "and", where that reasoning does not hold.
 * It never taints: it only covers values that are not objects or arrays, and the memo skips
 * those. The first frame that can be memoized is outside the search, so its answer does not
 * depend on anything the search recorded.
 */
const validateInner = (
  schema: Schema | undefined,
  value: unknown,
  state: ValidationState,
  visited?: Map<unknown, Set<Schema>>,
  hops = 0,
): boolean => {
  if (!schema) {
    return false
  }

  const trackable = isObject(value) || Array.isArray(value)

  // Both markers and results for one object live in one map, so each object costs one lookup.
  let entries: Map<Schema, boolean | typeof IN_FLIGHT> | undefined

  if (trackable) {
    entries = state.results.get(value)
    const known = entries?.get(schema)

    // Short-circuit on cycles: this exact `(value, schema)` pair is already being validated higher
    // up the call stack. Objects and arrays never reach the reachability search below, so they keep
    // this coinductive `true`. Pairs a caller listed count the same way and also taint, which is
    // stricter than needed (that list never changes during the call), but keeps one simple rule.
    if (known === IN_FLIGHT || state.callerInFlight?.get(value)?.has(schema)) {
      state.tainted = true
      return true
    }
    if (known !== undefined) {
      return known
    }

    if (entries) {
      entries.set(schema, IN_FLIGHT)
    } else {
      entries = new Map([[schema, IN_FLIGHT]])
      state.results.set(value, entries)
    }
  } else if (visited?.get(searchKey(value))?.has(schema)) {
    return false
  }

  // Only these node types recurse without entering an object or array, so only they can loop.
  const searching =
    !trackable &&
    (schema.type === 'union' || schema.type === 'optional' || schema.type === 'lazy' || schema.type === 'evaluate')
  const search = searching
    ? (visited ?? (hops >= UNTRACKED_HOPS ? new Map<unknown, Set<Schema>>() : undefined))
    : undefined
  if (search) {
    const key = searchKey(value)
    const nodes = search.get(key)
    if (nodes) {
      nodes.add(schema)
    } else {
      search.set(key, new Set([schema]))
    }
  }
  const nextHops = searching ? hops + 1 : 0

  // Each frame starts clean and hands its taint up to its parent on the way out.
  const outerTainted = state.tainted
  state.tainted = false

  // Everything below stays in this one function on purpose. Every extra function per schema node
  // is another stack frame per level of nesting, which lowers how deep a value can be validated.
  // Calls that stay in the reachability search pass `search` and `nextHops` along. Calls into an
  // item or a property pass nothing, and neither does anything called on an object or array.
  try {
    let result: boolean

    if (schema.type === 'any' || schema.type === 'unknown') {
      result = true
    } else if (schema.type === 'function') {
      result = typeof value === 'function'
    } else if (schema.type === 'number') {
      result = typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)
    } else if (schema.type === 'string') {
      result = typeof value === 'string'
    } else if (schema.type === 'boolean') {
      result = typeof value === 'boolean'
    } else if (schema.type === 'nullable') {
      result = value === null
    } else if (schema.type === 'notDefined') {
      result = value === undefined
    } else if (schema.type === 'array') {
      result = Array.isArray(value) && value.every((item) => validateInner(schema.items, item, state))
    } else if (schema.type === 'record') {
      result =
        isObject(value) &&
        Object.keys(value).every(
          (key) => validateInner(schema.key, key, state) && validateInner(schema.value, value[key], state),
        )
    } else if (schema.type === 'object') {
      result =
        isObject(value) &&
        Object.keys(schema.properties).every((key) => validateInner(schema.properties[key], value[key], state))
    } else if (schema.type === 'optional') {
      result = value === undefined || validateInner(schema.schema, value, state, search, nextHops)
    } else if (schema.type === 'union') {
      result = schema.schemas.some((branch) => validateInner(branch, value, state, search, nextHops))
    } else if (schema.type === 'intersection') {
      // An empty intersection has no constraints (matches `Array.prototype.every` on an empty list).
      // Otherwise the members are object schemas, so the value must be a plain object.
      result =
        schema.schemas.length === 0 ||
        (isObject(value) && schema.schemas.every((subSchema) => validateInner(subSchema, value, state)))
    } else if (schema.type === 'literal') {
      result = value === schema.value
    } else if (schema.type === 'lazy') {
      // The factory runs every time this node is validated, unless a cycle, a memo hit or a
      // loop-search hit answers first, and it may build a fresh schema object each time. That is
      // fine, because the cycle guards and the memo key on this `lazy` node, which stays the same.
      // Keep the `lazy` node as its own frame: resolving it away (or keying on what the factory
      // returns) would let `lazy(() => union([T, string()]))` recurse forever on a primitive.
      result = validateInner(schema.schema(), value, state, search, nextHops)
    } else if (schema.type === 'evaluate') {
      // A result that is not an object or array stays in the reachability search this `evaluate`
      // is in, if any, whether or not the expression changed the value. An object or array result
      // ignores the search, and the search starts over below it.
      result = validateInner(schema.schema, schema.expression(value), state, search, nextHops)
    } else {
      // We need to assert here that schema has the type never so we know we handle all cases
      const _exhaustive: never = schema
      // Log only the type, never the whole schema object, which may carry values from the document.
      console.warn('Unknown schema type:', (_exhaustive as { type?: unknown }).type)
      result = false
    }

    // Replacing the marker with the result memoizes it. Any other frame keeps the marker, which is
    // removed below like on any other way out.
    if (entries && !state.tainted && schema.type === 'lazy') {
      entries.set(schema, result)
    }

    return result
  } finally {
    // Always clear an in-progress marker, even when a sub-call throws. This keeps markers scoped to
    // the live call stack, so sibling branches (for example other `union` members) validate the
    // shared schema again instead of inheriting a stale short-circuit. The reachability search
    // keeps what it recorded on purpose (see above).
    if (entries?.get(schema) === IN_FLIGHT) {
      entries.delete(schema)
    }
    state.tainted = outerTainted || state.tainted
  }
}

/**
 * Validates that a given value matches the specified schema.
 *
 * The schema describes the expected structure/type of data.
 * Supported schema types include:
 * - 'any':         Accepts any value.
 * - 'unknown':     Accepts any value (generates `unknown` instead of `any` in types).
 * - 'function':    Only functions are valid (signature is not checked at runtime).
 * - 'number':      Only numbers are valid.
 * - 'string':      Only strings are valid.
 * - 'boolean':     Only booleans are valid.
 * - 'nullable':    Only `null` is valid.
 * - 'notDefined':  Only `undefined` is valid.
 * - 'array':       Array with all items validated recursively.
 * - 'record':      Object with string/number keys and values, checked recursively.
 * - 'object':      Plain object with fixed property keys, each validated recursively.
 * - 'union':       Accepts if value matches any of the listed schemas.
 * - 'optional':    Accepts `undefined` or a value matching the inner schema.
 * - 'intersection': Accepts if value matches every member schema (members are object schemas; value must be a plain object).
 * - 'literal':     Exact match with a literal value.
 * - 'lazy':        Delegates to the schema returned by the factory.
 * - 'evaluate':    Transforms value then validates against an inner schema.
 *
 * @example
 * ```ts
 * import { number, object, string, validate } from '@scalar/validation'
 *
 * const schema = object({ id: number(), name: string() })
 * validate(schema, { id: 1, name: 'Ada' }) // true
 * validate(schema, { id: 1, name: 2 }) // false
 * ```
 *
 * Cyclic value graphs (for example a node whose child points back at itself,
 * paired with a `lazy` schema) are handled without a `cache`. The optional
 * `cache` argument lists object–schema pairs to treat as already being
 * validated, so they pass without being checked. Callers normally omit it.
 *
 * Loops are answered differently depending on the value. When an object or
 * array leads back to a check that is already in progress for it, that check
 * counts as passing, and any real mismatch surfaces elsewhere. When a schema
 * loops back to itself on any other value, without passing through an object or
 * array, the loop does not count as a match:
 * `lazy(() => union([self, string()]))` accepts `'s'` and rejects `7`, but
 * accepts `{}`.
 *
 * If schema is `undefined`, validation fails.
 * Returns true if the value matches the schema, false otherwise.
 */
export const validate = (schema: Schema | undefined, value: unknown, cache?: WeakMap<object, Set<Schema>>): boolean =>
  validateInner(schema, value, { results: new WeakMap(), callerInFlight: cache, tainted: false })
