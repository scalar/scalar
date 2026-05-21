import { type Schema, boolean, intersection, lazy, object, optional, record, string } from '@scalar/validation'

import { XScalarSelectedContentType } from '@/extensions/operation'

import { createOpenApiMediaTypeSchemas } from './media-type'
import { type MaybeRefFn, normalRef } from './reference'

/**
 * Builds the Request Body Object schema for {@link createOpenApiDocumentSchema}.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createOpenApiRequestBodyObject = (maybeRef: MaybeRefFn): Schema => {
  const { mediaTypeObject } = createOpenApiMediaTypeSchemas(maybeRef)

  return intersection(
    [
      object({
        description: optional(
          string({
            typeComment:
              'A brief description of the request body. This could contain examples of use. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        content: record(
          string(),
          lazy(() => mediaTypeObject),
          {
            typeComment:
              'REQUIRED. The content of the request body. The key is a media type or media type range and the value describes it.',
            typeName: 'RequestBodyContent',
          },
        ),
        required: optional(
          boolean({ typeComment: 'Determines if the request body is required in the request. Defaults to false.' }),
        ),
      }),
      XScalarSelectedContentType,
    ],
    { typeName: 'RequestBodyObject' },
  )
}

export const openApiRequestBodyObject = createOpenApiRequestBodyObject(normalRef)
