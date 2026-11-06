import { boolean, literal, object, optional, record, string, union } from '@scalar/validation'

/** Explicit credential bindings for custom documentation examples. */
export const XScalarCredentialPlaceholders = object(
  {
    'x-scalar-credential-placeholders': optional(
      record(
        string(),
        object({
          field: union([
            literal('token'),
            literal('username'),
            literal('password'),
            literal('clientId'),
            literal('clientSecret'),
          ]),
          mask: optional(
            boolean({
              typeComment: 'Mask the field in displayed examples. Defaults to true; copy includes the real value.',
            }),
          ),
        }),
      ),
      { typeComment: 'Maps {{name}} placeholders to credentials from this security scheme' },
    ),
  },
  {
    typeName: 'XScalarCredentialPlaceholders',
    typeComment: 'Explicit credential bindings for custom documentation examples',
  },
)
