import { Type, type Static } from '@sinclair/typebox'

export const xScalarEnvVarSchema = Type.Union([
  Type.Partial(
    Type.Object({
      description: Type.String(),
      default: Type.String(),
    }),
  ),
  Type.String(),
])

export type XScalarEnvVar = Static<typeof xScalarEnvVarSchema>

export const xScalarEnvironmentSchema = Type.Object({
  description: Type.Optional(Type.String()),
  color: Type.Optional(Type.String()),
  /** A map of variables by name */
  variables: Type.Record(Type.String(), xScalarEnvVarSchema),
})

export type XScalarEnvironment = Static<typeof xScalarEnvironmentSchema>

export const xScalarEnvironmentsSchema = Type.Record(Type.String(), xScalarEnvironmentSchema)

export type XScalarEnvironments = Static<typeof xScalarEnvironmentsSchema>
