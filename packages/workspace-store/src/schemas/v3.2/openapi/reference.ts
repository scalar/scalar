import { isObject } from '@scalar/helpers/object/is-object'
import {
  type Schema,
  boolean,
  evaluate,
  intersection,
  literal,
  object,
  optional,
  string,
  union,
} from '@scalar/validation'

const referenceExtensions = object(
  {
    '$status': optional(union([literal('loading'), literal('error')]), {
      typeComment: `Indicates the current status of the reference resolution. Can be either 'loading' while fetching the reference or 'error' if the resolution failed.`,
    }),
    '$global': optional(
      boolean({
        typeComment:
          'Indicates whether this reference should be resolved globally across all documents, rather than just within the current document context.',
      }),
    ),
  },
  { typeName: 'ReferenceObjectExtensions' },
)

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

export const normalRef = (schema: Schema): Schema => union([schema, reference])

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
export const recursiveRef = (schema: Schema): Schema =>
  union([schema, intersection([reference, object({ '$ref-value': evaluate(e, schema) }), referenceExtensions])])
