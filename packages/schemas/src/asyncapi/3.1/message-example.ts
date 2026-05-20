import { object, optional, record, string, unknown } from '@scalar/validation'

export const asyncApiMessageExampleObject = object(
  {
    headers: optional(
      record(string(), unknown(), {
        typeComment: 'Example headers; MUST validate against the Message Object headers field when present.',
      }),
    ),
    payload: optional(
      unknown({ typeComment: 'Example payload; MUST validate against the Message Object payload field when present.' }),
    ),
    name: optional(string({ typeComment: 'A machine-friendly name.' })),
    summary: optional(string({ typeComment: 'A short summary of what the example is about.' })),
  },
  { typeName: 'AsyncApiMessageExampleObject' },
)
