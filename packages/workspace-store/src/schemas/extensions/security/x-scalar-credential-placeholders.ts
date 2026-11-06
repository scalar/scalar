import { Type } from '@scalar/typebox'
import { boolean, literal, object, optional, record, string, union } from '@scalar/validation'

/** Credential fields that can be inserted into documentation examples. */
export type CredentialPlaceholderField = 'token' | 'username' | 'password' | 'clientId' | 'clientSecret'

/** Explicit bindings keep ordinary template syntax unrelated to authentication unchanged. */
export type XScalarCredentialPlaceholders = {
  'x-scalar-credential-placeholders'?: Record<string, { field: CredentialPlaceholderField; mask?: boolean }>
}

export const XScalarCredentialPlaceholdersSchema = Type.Object({
  'x-scalar-credential-placeholders': Type.Optional(
    Type.Record(
      Type.String(),
      Type.Object({
        field: Type.Union([
          Type.Literal('token'),
          Type.Literal('username'),
          Type.Literal('password'),
          Type.Literal('clientId'),
          Type.Literal('clientSecret'),
        ]),
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
        field: union([
          literal('token'),
          literal('username'),
          literal('password'),
          literal('clientId'),
          literal('clientSecret'),
        ]),
        mask: optional(boolean()),
      }),
    ),
  ),
})
