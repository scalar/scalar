import { CREDENTIAL_PLACEHOLDER_FIELDS } from '@scalar/helpers/http/credential-placeholder-fields'
import { type TLiteral, Type } from '@scalar/typebox'
import { boolean, literal, object, optional, record, string, union } from '@scalar/validation'

/** Credential fields that can be inserted into documentation examples. */
export type CredentialPlaceholderField = (typeof CREDENTIAL_PLACEHOLDER_FIELDS)[number]

/** Explicit bindings keep ordinary template syntax unrelated to authentication unchanged. */
export type XScalarCredentialPlaceholders = {
  'x-scalar-credential-placeholders'?: Record<string, { field: CredentialPlaceholderField; mask?: boolean }>
}

export const XScalarCredentialPlaceholdersSchema = Type.Object({
  'x-scalar-credential-placeholders': Type.Optional(
    Type.Record(
      Type.String(),
      Type.Object({
        field: Type.Union(
          // Keep the non-empty tuple shape used by downstream schema transformations.
          CREDENTIAL_PLACEHOLDER_FIELDS.map((field) => Type.Literal(field)) as [
            TLiteral<CredentialPlaceholderField>,
            ...TLiteral<CredentialPlaceholderField>[],
          ],
        ),
        mask: Type.Optional(Type.Boolean()),
      }),
    ),
  ),
})

export const XScalarCredentialPlaceholders = object({
  'x-scalar-credential-placeholders': optional(
    record(
      string(),
      object({
        field: union(CREDENTIAL_PLACEHOLDER_FIELDS.map((field) => literal(field))),
        mask: optional(boolean()),
      }),
    ),
  ),
})
