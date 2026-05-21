import { object, optional, record, string } from '@scalar/validation'

export const discriminatorObject = object(
  {
    propertyName: string({
      typeComment:
        'REQUIRED. The name of the property in the payload that will hold the discriminating value. This property SHOULD be required in the payload schema, as the behavior when the property is absent is undefined.',
    }),
    mapping: optional(
      record(string(), string(), {
        typeComment: 'An object to hold mappings between payload values and schema names or URI references.',
      }),
    ),
  },
  { typeName: 'DiscriminatorObject' },
)
