import { Type } from '@scalar/typebox'

// Schema for the optional 'x-scalar-active-environment' extension property
export const XScalarActiveEnvironmentSchema = Type.Object({
  'x-scalar-active-environment': Type.Optional(Type.String()),
})

// Type definition for the optional 'x-scalar-active-environment' property
export type XScalarActiveEnvironment = {
  /** The currently selected environment */
  'x-scalar-active-environment'?: string
}
