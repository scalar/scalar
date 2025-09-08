import { type Static, Type } from '@scalar/typebox'

export const xScalarClientConfigEnvVarSchema = Type.Union([
  Type.Partial(
    Type.Object({
      description: Type.String(),
      default: Type.String(),
    }),
  ),
  Type.String(),
])

export type xScalarClientConfigEnvVar = Static<typeof xScalarClientConfigEnvVarSchema>

export const xScalarClientConfigEnvironmentSchema = Type.Object({
  description: Type.Optional(Type.String()),
  color: Type.Optional(Type.String()),
  /** A map of variables by name */
  variables: Type.Record(Type.String(), xScalarClientConfigEnvVarSchema),
})

export type xScalarClientConfigEnvironment = Static<typeof xScalarClientConfigEnvironmentSchema>

export const xScalarClientConfigEnvironmentsSchema = Type.Record(Type.String(), xScalarClientConfigEnvironmentSchema)

export type XScalarClientConfigEnvironments = Static<typeof xScalarClientConfigEnvironmentsSchema>
