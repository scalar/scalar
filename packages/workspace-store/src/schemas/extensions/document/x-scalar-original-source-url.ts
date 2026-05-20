import { Type } from '@scalar/typebox'
import { object, optional, string } from '@scalar/validation'

/**
 * Schema for the `x-scalar-original-source-url` OpenAPI extension.
 * Tracks where the document was loaded from (file path or remote URL).
 */
export const XScalarOriginalSourceUrlSchema = Type.Partial(
  Type.Object({
    /** Original document source URL when loaded from an external source. */
    'x-scalar-original-source-url': Type.String(),
  }),
)

export type XScalarOriginalSourceUrl = Partial<{
  /** Original document source URL when loaded from an external source. */
  'x-scalar-original-source-url': string
}>

export const XScalarOriginalSourceUrl = object(
  {
    'x-scalar-original-source-url': optional(
      string({ typeComment: 'Original document source URL when loaded from an external source' }),
    ),
  },
  {
    typeName: 'XScalarOriginalSourceUrl',
    typeComment: 'Original document source URL when loaded from an external source.',
  },
)
