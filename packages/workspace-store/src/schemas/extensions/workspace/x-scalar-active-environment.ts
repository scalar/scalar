import { Type } from '@scalar/typebox'

export const XScalarActiveEnvironmentSchema = Type.Object({
  'x-scalar-active-environment': Type.Optional(Type.String()),
})

export type XScalarActiveEnvironment = {
  /** The currently selected environment */
  'x-scalar-active-environment'?: string
}
