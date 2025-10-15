import { Type } from '@scalar/typebox'

// Binding Schema - Protocol-specific bindings
const BindingSchemaDefinition = Type.Record(
  Type.String(),
  Type.Any(), // Protocol-specific binding information
)

export type Binding = {
  /** Protocol-specific binding information. */
  [key: string]: any
}

// Module definition
const module = Type.Module({
  Binding: BindingSchemaDefinition,
})

// Export schemas
export const BindingSchema = module.Import('Binding')
