import { isObject } from './helpers/is-object'
import type { Schema } from './schema'

/**
 * Per-call bookkeeping for {@link validateInner}. A fresh state is created for every top-level
 * {@link validate} call, never at module scope: values are mutable, so a result remembered from an
 * earlier call could be stale.
 */
type ValidationState = {
  /**
   * `(object, schema)` pairs that are *currently in flight on the call stack*. Re-entering one
   * means the value graph has a cycle, and the call short-circuits to `true`.
   */
  inFlight: WeakMap<object, Set<Schema>>
  /**
   * Finished results for `(object, schema)` pairs. Without it, a value reachable through more
   * than one branch (for example an undiscriminated recursive union) is validated again once per
   * branch at every level, which takes exponential time in the nesting depth.
   */
  memo: WeakMap<object, Map<Schema, boolean>>
  /**
   * Whether the frame being validated, or anything below it, short-circuited on a value cycle.
   * Such a result depends on which pairs happen to be in flight, not only on `(value, schema)`,
   * so it must not be memoized.
   */
  tainted: boolean
}

/**
 * Internal validation implementation.
 *
 * Objects and arrays can form cycles, so `(value, schema)` pairs that are in flight are tracked in
 * `state.inFlight`. Re-entering a pair that is already being validated higher up the stack
 * short-circuits to `true`: any concrete mismatch would surface at that enclosing call rather than
 * via the cycle. The marker is removed before the call returns, so it only ever describes the live
 * call stack. Without that removal a failed branch (for example the first member of a `union`)
 * would leave stale entries that later sibling branches would mistake for a cycle.
 *
 * Finished results are memoized in `state.memo`, but only when the frame never hit that cycle
 * short-circuit (see {@link ValidationState.tainted}). The short-circuit needs a value that leads
 * back to itself, or a schema that recurses on the same object without looking inside it, so a
 * parsed JSON document checked against a real schema is fully memoized. Anything that did hit it
 * is validated again when reached, just like before the memo existed.
 *
 * Primitives (and other values that are not plain objects or arrays) cannot form cycles, but a
 * schema can: `T = lazy(() => union([T, string()]))` keeps asking whether `7` matches `T`.
 * `sameValueNodes` holds the schema nodes that have recursed on this exact value since the value
 * last changed. Re-entering one of them returns `false`. That is exact rather than a cut-off:
 * on such a value, only `union`, `optional`, `lazy` and an `evaluate` that returns its input
 * recurse without changing the value, and they only ever combine results with "or". A cycle
 * through them can never be the reason a value matches, so the answer is the one found by the
 * other branches.
 *
 * This guard never taints. It only fires on values that are not objects or arrays, and every
 * frame that shares such a value is skipped by the memo anyway. The first frame that can be
 * memoized sits across a step that changed the value, where the node set starts empty again.
 */
const validateInner = (
  schema: Schema | undefined,
  value: unknown,
  state: ValidationState,
  sameValueNodes?: Set<Schema>,
): boolean => {
  if (!schema) {
    return false
  }

  const trackable = isObject(value) || Array.isArray(value)

  if (trackable) {
    // Short-circuit on cycles: this exact `(value, schema)` pair is already being validated higher
    // up the call stack. This has to come before the memo read and the schema-node guard, so objects
    // and arrays keep this coinductive `true` instead of a `false` from the schema-node guard.
    if (state.inFlight.get(value)?.has(schema)) {
      state.tainted = true
      return true
    }

    const memoized = state.memo.get(value)?.get(schema)
    if (memoized !== undefined) {
      return memoized
    }

    const schemas = state.inFlight.get(value) ?? new Set<Schema>()
    schemas.add(schema)
    state.inFlight.set(value, schemas)
  } else if (sameValueNodes?.has(schema)) {
    return false
  }

  // Only these node types recurse without changing the value, so only they can close a schema cycle.
  // Tracking just them keeps plain leaf checks, like a `string()` on a string, free of allocations.
  const nodes =
    !trackable &&
    (schema.type === 'union' || schema.type === 'optional' || schema.type === 'lazy' || schema.type === 'evaluate')
      ? (sameValueNodes ?? new Set<Schema>())
      : undefined
  nodes?.add(schema)

  // Each frame starts clean and hands its taint up to its parent on the way out.
  const outerTainted = state.tainted
  state.tainted = false

  // Everything below stays in this one function on purpose. Every extra function per schema node
  // is another stack frame per level of nesting, which lowers how deep a value can be validated.
  // Calls that keep the same value pass `nodes` along. Calls that move to a different value (an
  // item, a property, or an `evaluate` result) pass nothing, so the schema-node guard starts over.
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
      result = value === undefined || validateInner(schema.schema, value, state, nodes)
    } else if (schema.type === 'union') {
      result = schema.schemas.some((branch) => validateInner(branch, value, state, nodes))
    } else if (schema.type === 'intersection') {
      // An empty intersection has no constraints (matches `Array.prototype.every` on an empty list).
      // Otherwise the members are object schemas, so the value must be a plain object.
      result =
        schema.schemas.length === 0 ||
        (isObject(value) && schema.schemas.every((subSchema) => validateInner(subSchema, value, state)))
    } else if (schema.type === 'literal') {
      result = value === schema.value
    } else if (schema.type === 'lazy') {
      // The factory runs on every visit and may build a fresh schema object each time. That is fine,
      // because the cycle guards and the memo key on this `lazy` node, which stays the same. Keep the
      // `lazy` node as its own frame: resolving it away (or keying on what the factory returns) would
      // let `lazy(() => union([T, string()]))` recurse forever on a primitive.
      result = validateInner(schema.schema(), value, state, nodes)
    } else if (schema.type === 'evaluate') {
      const evaluated = schema.expression(value)
      // Only a real change of value starts the schema-node guard over. An expression that returns
      // its input (a `$ref` resolver does this for anything that is not a reference) is not a step
      // forward, and resetting there would let a cycle through it recurse forever.
      result = validateInner(schema.schema, evaluated, state, Object.is(evaluated, value) ? nodes : undefined)
    } else {
      // We need to assert here that schema has the type never so we know we handle all cases
      const _exhaustive: never = schema
      console.warn('Unknown schema type:', _exhaustive)
      result = false
    }

    if (trackable && !state.tainted) {
      const results = state.memo.get(value) ?? new Map<Schema, boolean>()
      results.set(schema, result)
      state.memo.set(value, results)
    }

    return result
  } finally {
    // Always clear the in-progress markers, even when a sub-call throws. This keeps them scoped to
    // the live call stack, so sibling branches (for example other `union` members) validate the
    // shared schema again instead of inheriting a stale short-circuit.
    if (trackable) {
      state.inFlight.get(value)?.delete(schema)
    }
    nodes?.delete(schema)
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
 * The optional `cache` argument tracks the object–schema pairs currently being
 * validated, which stops infinite recursion on cyclic value graphs (for example
 * a node whose child points back at itself paired with a `lazy` schema).
 * Callers normally omit it.
 *
 * If schema is `undefined`, validation fails.
 * Returns true if the value matches the schema, false otherwise.
 */
export const validate = (
  schema: Schema | undefined,
  value: unknown,
  cache: WeakMap<object, Set<Schema>> = new WeakMap(),
): boolean => validateInner(schema, value, { inFlight: cache, memo: new WeakMap(), tainted: false })
