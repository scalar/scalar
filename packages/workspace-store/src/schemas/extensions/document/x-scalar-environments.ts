import { Type } from '@scalar/typebox'

export const xScalarEnvVarSchema = Type.Object({
  name: Type.String(),
  value: Type.Union([
    Type.Object({
      description: Type.Optional(Type.String()),
      default: Type.String({ default: '' }),
    }),
    Type.String(),
  ]),
})

/** A scalar environment variable */
export type XScalarEnvVar = {
  name: string
  value:
    | {
        description?: string
        default: string
      }
    | string
}

export const xScalarEnvironmentSchema = Type.Object({
  description: Type.Optional(Type.String()),
  color: Type.String({ default: '#FFFFFF' }),
  variables: Type.Array(xScalarEnvVarSchema),
})

export type XScalarEnvironment = {
  /** Optional description for the environment */
  description?: string
  /** Color for the environment */
  color: string
  /** An array of variables */
  variables: XScalarEnvVar[]
}

export const xScalarEnvironmentsSchema = Type.Object({
  'x-scalar-environments': Type.Optional(Type.Record(Type.String(), xScalarEnvironmentSchema)),
})

export type XScalarEnvironments = {
  /** A record of environments by name */
  'x-scalar-environments'?: Record<string, XScalarEnvironment>
}
