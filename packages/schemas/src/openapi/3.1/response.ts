import { lazy, object, optional, record, string } from '@scalar/validation'

import { openApiLinkObject } from './link'
import { createOpenApiMediaTypeSchemas } from './media-type'
import { type MaybeRefFn, normalRef } from './reference'

/**
 * Builds Response-related schemas for {@link createOpenApiDocumentSchema}.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 * @returns `responseObject` and `responsesObject`.
 */
export const createOpenApiResponseSchemas = (maybeRef: MaybeRefFn) => {
  const { mediaTypeObject, headerObject } = createOpenApiMediaTypeSchemas(maybeRef)

  const responseObject = object(
    {
      description: string({
        typeComment:
          'REQUIRED. A description of the response. CommonMark syntax MAY be used for rich text representation.',
      }),
      headers: optional(record(string(), maybeRef(lazy(() => headerObject)), { typeName: 'ResponseHeaders' })),
      content: optional(
        record(
          string(),
          lazy(() => mediaTypeObject),
          {
            typeName: 'ResponseContent',
          },
        ),
      ),
      links: optional(record(string(), maybeRef(lazy(() => openApiLinkObject)), { typeName: 'ResponseLinks' })),
    },
    { typeName: 'ResponseObject' },
  )

  const responsesObject = record(string(), maybeRef(lazy(() => responseObject)), {
    typeName: 'ResponsesObject',
  })

  return { responseObject, responsesObject }
}

const defaultResponseSchemas = createOpenApiResponseSchemas(normalRef)

export const openApiResponseObject = defaultResponseSchemas.responseObject
export const openApiResponsesObject = defaultResponseSchemas.responsesObject
