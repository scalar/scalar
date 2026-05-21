import { lazy, object, optional, record, string } from '@scalar/validation'

import { link } from '@/openapi/3.1/link'
import { header, mediaType } from '@/openapi/3.1/media-type'
import { recursiveRef } from '@/openapi/3.1/reference'

export const response = object(
  {
    description: string({
      typeComment:
        'REQUIRED. A description of the response. CommonMark syntax MAY be used for rich text representation.',
    }),
    headers: optional(record(string(), recursiveRef(lazy(() => header)), { typeName: 'ResponseHeaders' })),
    content: optional(
      record(
        string(),
        lazy(() => mediaType),
        { typeName: 'ResponseContent' },
      ),
    ),
    links: optional(record(string(), recursiveRef(lazy(() => link)), { typeName: 'ResponseLinks' })),
  },
  { typeName: 'ResponseObject' },
)

export const responsesObject = record(string(), recursiveRef(lazy(() => response)), {
  typeName: 'ResponsesObject',
})
