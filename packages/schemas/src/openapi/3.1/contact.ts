import { object, optional, string } from '@scalar/validation'

export const openApiContactObject = object(
  {
    name: optional(string({ typeComment: 'The name of the contact.' })),
    url: optional(string({ typeComment: 'The URI for the contact information. This MUST be in the form of a URI.' })),
    email: optional(
      string({
        typeComment:
          'The email address of the contact person/organization. This MUST be in the form of an email address.',
      }),
    ),
  },
  { typeName: 'ContactObject' },
)
