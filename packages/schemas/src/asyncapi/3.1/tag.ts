import { array, object, optional, string } from '@scalar/validation'

import { asyncApiExternalDocumentationObject } from './external-documentation'
import { recursiveRef } from './reference'

/** Tag Object | Reference Object */
export const asyncApiTagObject = recursiveRef(
  object(
    {
      name: string({ typeComment: 'REQUIRED. The name of the tag.' }),
      description: optional(
        string({
          typeComment: 'A short description for the tag. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      externalDocs: optional(asyncApiExternalDocumentationObject),
    },
    { typeName: 'AsyncApiTagObject' },
  ),
)

export const asyncApiTagsObject = array(asyncApiTagObject, {
  typeName: 'AsyncApiTagsObject',
  typeComment: 'A list of Tag Objects (entries MAY be Reference Objects).',
})
