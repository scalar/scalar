import { object, optional, string } from '@scalar/validation'

export const asyncApiContactObject = object(
  {
    name: optional(string({ typeComment: 'The identifying name of the contact person/organization.' })),
    url: optional(
      string({
        typeComment: 'The URL pointing to the contact information. This MUST be in the form of an absolute URL.',
      }),
    ),
    email: optional(string({ typeComment: 'The email address of the contact person/organization.' })),
  },
  { typeName: 'AsyncApiContactObject' },
)
