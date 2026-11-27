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

import { followReferenceChain } from '@/helpers/get-resolved-ref'

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

export const recursiveRef = (schema: Schema): Schema =>
  union([
    schema,
    intersection([
      reference,
      object({ '$ref-value': evaluate((value) => followReferenceChain(value).value, schema) }),
      referenceExtensions,
    ]),
  ])
