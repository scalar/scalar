import { Type } from '@scalar/typebox'

export const xScalarEnvVarSchema = Type.Union([
  Type.Partial(
    Type.Object({
      description: Type.String(),
      default: Type.String(),
    }),
  ),
  Type.String(),
])

/** A scalar environment variable */
export type XScalarEnvVar =
  | {
      description?: string
      default?: string
    }
  | string

export const xScalarEnvironmentSchema = Type.Object({
  description: Type.Optional(Type.String()),
  color: Type.Optional(Type.String()),
  variables: Type.Record(Type.String(), xScalarEnvVarSchema),
})

export type XScalarEnvironment = {
  /** Optional description for the environment */
  description?: string
  /** Optional color for the environment */
  color?: string
  /** A map of variables by name */
  variables: Record<string, XScalarEnvVar>
}

export const xScalarEnvironmentsSchema = Type.Object({
  'x-scalar-environments': Type.Optional(Type.Record(Type.String(), xScalarEnvironmentSchema)),
})

export type XScalarEnvironments = {
  /** A record of environments by name */
  'x-scalar-environments'?: Record<string, XScalarEnvironment>
}
