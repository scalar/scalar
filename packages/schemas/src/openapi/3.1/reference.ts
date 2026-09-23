import { isObject } from '@scalar/helpers/object/is-object'
import { type Schema, evaluate, intersection, object, optional, string, union } from '@scalar/validation'

import { referenceExtensions } from '@/general/bundler-extensions'

const reference = object(
  {
    '$ref': string({ typeComment: 'REQUIRED. The reference identifier. This MUST be in the form of a URI.' }),
    summary: optional(
      string({
        typeComment:
          'A short summary which by default SHOULD override that of the referenced component. If the referenced object-type does not allow a summary field, then this field has no effect.',
      }),
    ),
    description: optional(
      string({
        typeComment:
          'A description which by default SHOULD override that of the referenced component. CommonMark syntax MAY be used for rich text representation. If the referenced object-type does not allow a description field, then this field has no effect.',
      }),
    ),
  },
  {
    typeName: 'ReferenceObject',
  },
)

/**
 * Wraps a JSON Schema so it may also be satisfied by a Reference Object (no resolved `$ref-value`).
 *
 * Use for `components.schemas` and schema composition (`allOf`, `properties`, `items`, and similar)
 * where references follow JSON Schema / OpenAPI schema rules only.
 */
export const normalRef = (inner: Schema): Schema => union([reference, inner])

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
 * Inline object or Reference Object with resolved `$ref-value` and bundle extensions.
 *
 * Schemas in this folder use {@link recursiveRef} directly. Use {@link recursiveRef} when generating
 * types for resolved or proxy documents (see `generate-types.ts`).
 */
export const recursiveRef = (inner: Schema): Schema =>
  union([inner, intersection([reference, object({ '$ref-value': evaluate(e, inner) }), referenceExtensions])])
