import { array, object, optional, string, union } from '@scalar/validation'

import { asyncApiExternalDocumentationObject } from './external-documentation'
import { asyncApiReferenceObject, normalRef } from './reference'

export const asyncApiTagObject = union(
  [
    asyncApiReferenceObject,
    object(
      {
        name: string({ typeComment: 'REQUIRED. The name of the tag.' }),
        description: optional(
          string({
            typeComment: 'A short description for the tag. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        externalDocs: optional(normalRef(asyncApiExternalDocumentationObject)),
      },
      { typeName: 'AsyncApiTagObject' },
    ),
  ],
  { typeName: 'AsyncApiTagOrReference' },
)

export const asyncApiTagsObject = array(normalRef(asyncApiTagObject), {
  typeName: 'AsyncApiTagsObject',
  typeComment: 'A list of Tag Objects (entries MAY be Reference Objects).',
})
