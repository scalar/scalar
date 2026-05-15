import { object, optional, string, union } from '@scalar/validation'

import { asyncApiReferenceObject } from './reference'

/** External Documentation Object or Reference Object. */
export const asyncApiExternalDocumentationObject = union(
  [
    asyncApiReferenceObject,
    object(
      {
        description: optional(
          string({
            typeComment:
              'A short description of the target documentation. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        url: string({
          typeComment: 'REQUIRED. The URL for the target documentation. This MUST be in the form of an absolute URL.',
        }),
      },
      { typeName: 'AsyncApiExternalDocumentationObject' },
    ),
  ],
  { typeName: 'AsyncApiExternalDocumentationOrReference' },
)
