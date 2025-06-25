import { Type, type Static } from '@sinclair/typebox'

export const xScalarSecretVarSchema = Type.Object({
  description: Type.Optional(Type.String()),
  example: Type.Optional(Type.String()),
})

export type XScalarSecretVar = Static<typeof xScalarSecretVarSchema>

export const xScalarSecretsSchema = Type.Record(Type.String(), xScalarSecretVarSchema)

export type XScalarSecrets = Static<typeof xScalarSecretsSchema.Type>
