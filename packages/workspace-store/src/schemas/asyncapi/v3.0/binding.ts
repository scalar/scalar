import { Type } from '@scalar/typebox'

// Binding Schema - Protocol-specific bindings
export const BindingSchemaDefinition = Type.Record(
  Type.String(),
  Type.Any(), // Protocol-specific binding information
)

export type Binding = {
  /** Protocol-specific binding information. */
  [key: string]: any
}
