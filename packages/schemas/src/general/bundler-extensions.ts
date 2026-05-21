import { boolean, literal, object, optional, union } from '@scalar/validation'

export const referenceExtensions = object(
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
