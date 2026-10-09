import { isObject } from '@scalar/helpers/object/is-object'
import { type Schema, evaluate, intersection, object, optional, string, union } from '@scalar/validation'

import { referenceExtensions } from '@/general/bundler-extensions'

/**
 * Wraps an inline schema so it may also be satisfied by an AsyncAPI Reference Object.
 *
 * Schemas in this folder use {@link recursiveRef} directly. Use {@link recursiveRef} only when
 * generating types for resolved or proxy documents (see `generate-types.ts`).
 */
export type MaybeRefFn = (inner: Schema) => Schema

/**
 * AsyncAPI Reference Object (JSON Reference). Only `$ref` is defined; additional
 * properties SHALL be ignored per the specification.
 */
export const asyncApiReferenceObject = object(
  {
    '$ref': string({ typeComment: 'REQUIRED. The reference string.' }),
  },
  { typeName: 'AsyncApiReferenceObject', typeComment: 'JSON Reference for AsyncAPI components.' },
)

/**
 * Follows a chain of references to the value at its end. References can form a loop (`A` points at
 * `B` and `B` points back at `A`, or a schema points at itself), so we stop at the first reference we
 * have already passed. Without that, a loop in an untrusted document overflows the stack.
 */
const e = (value: unknown): unknown => {
  const seen = new Set<unknown>()
  let current = value

  while (isObject(current) && '$ref' in current && !seen.has(current)) {
    seen.add(current)
    current = current['$ref-value']
  }

  return current
}

/**
 * Reference Object with resolved `$ref-value` and bundle extensions.
 *
 * Use when the specification allows only a Reference Object (not an inline object), for example
 * `operation.channel` or `channel.servers`.
 *
 * `$ref-value` is a resolved-document extension populated by the bundler/proxy at access time, so it
 * is optional here. If coercion required it, an unresolved `{ $ref }` would be filled with a default
 * instance of `schema` (for a security scheme, the first `type` literal — `userPassword`). Because the
 * magic proxy shares one target object between a `$ref-value` and the component it points at, that
 * synthetic default then leaks back over the real definition, clobbering its `type`.
 */
export const asyncApiResolvedReference = (schema: Schema): Schema =>
  intersection([asyncApiReferenceObject, object({ '$ref-value': optional(evaluate(e, schema)) }), referenceExtensions])

/** Inline object or Reference Object with resolved `$ref-value`. */
export const recursiveRef = (schema: Schema): Schema => union([schema, asyncApiResolvedReference(schema)])
