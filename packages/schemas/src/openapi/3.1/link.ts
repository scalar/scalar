import { any, object, optional, record, string } from '@scalar/validation'

import { server } from '@/openapi/3.1/server'

export const link = object(
  {
    operationRef: optional(
      string({
        typeComment:
          'A URI reference to an OAS operation. This field is mutually exclusive of the operationId field, and MUST point to an Operation Object.',
      }),
    ),
    operationId: optional(
      string({
        typeComment:
          'The name of an existing, resolvable OAS operation, as defined with a unique operationId. This field is mutually exclusive of the operationRef field.',
      }),
    ),
    parameters: optional(
      record(string(), any(), {
        typeComment:
          'A map representing parameters to pass to an operation as specified with operationId or identified via operationRef.',
        typeName: 'LinkParameters',
      }),
    ),
    requestBody: optional(
      any({
        typeComment: 'A literal value or {expression} to use as a request body when calling the target operation.',
      }),
    ),
    description: optional(
      string({
        typeComment: 'A description of the link. CommonMark syntax MAY be used for rich text representation.',
      }),
    ),
    server: optional(server),
  },
  { typeName: 'LinkObject' },
)
