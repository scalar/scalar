import { CREDENTIAL_PLACEHOLDER_FIELDS } from '@scalar/helpers/http/credential-placeholder-fields'
import { boolean, literal, object, optional, record, string, union } from '@scalar/validation'

/** Explicit credential bindings for custom documentation examples. */
export const XScalarCredentialPlaceholders = object(
  {
    'x-scalar-credential-placeholders': optional(
      record(
        string(),
        object({
          field: union(CREDENTIAL_PLACEHOLDER_FIELDS.map((field) => literal(field))),
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
