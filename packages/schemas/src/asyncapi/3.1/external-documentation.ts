import { object, optional, string } from '@scalar/validation'

import { normalRef } from './reference'

/** External Documentation Object | Reference Object */
export const asyncApiExternalDocumentationObject = normalRef(
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
)
