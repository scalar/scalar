import { any, intersection, object, optional, string } from '@scalar/validation'

import { XDisabled } from '@/extensions/example'

export const openApiExampleObject = intersection(
  [
    object({
      summary: optional(string({ typeComment: 'Short description for the example.' })),
      description: optional(
        string({
          typeComment: 'Long description for the example. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      value: optional(
        any({
          typeComment: 'Embedded literal example. The value field and externalValue field are mutually exclusive.',
        }),
      ),
      externalValue: optional(
        string({
          typeComment:
            'A URI that identifies the literal example. The value field and externalValue field are mutually exclusive.',
        }),
      ),
    }),
    XDisabled,
  ],
  { typeName: 'ExampleObject' },
)
