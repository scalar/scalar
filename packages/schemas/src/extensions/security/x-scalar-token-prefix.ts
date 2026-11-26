import { object, optional, string } from '@scalar/validation'

/** Prefix added only to header API-key credentials. */
export const XScalarTokenPrefix = object(
  {
    'x-scalar-token-prefix': optional(
      string({
        typeComment:
          'Prefix for header API keys, separated from the credential by one space. Ignored for query and cookie API keys.',
      }),
    ),
  },
  { typeName: 'XScalarTokenPrefix', typeComment: 'An optional prefix for header API keys.' },
)
