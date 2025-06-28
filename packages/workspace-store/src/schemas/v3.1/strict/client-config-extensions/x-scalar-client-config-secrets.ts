import { Type, type Static } from '@sinclair/typebox'

export const xScalarClientConfigSecretVarSchema = Type.Object({
  description: Type.Optional(Type.String()),
  example: Type.Optional(Type.String()),
})

export type xScalarClientConfigSecretVar = Static<typeof xScalarClientConfigSecretVarSchema>

export const xScalarClientConfigSecretsSchema = Type.Record(Type.String(), xScalarClientConfigSecretVarSchema)

export type xScalarClientConfigSecrets = Static<typeof xScalarClientConfigSecretsSchema.Type>
