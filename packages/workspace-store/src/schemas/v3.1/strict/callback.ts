import { Type, type Static } from '@scalar/typebox'
import { reference } from '@/schemas/v3.1/strict/reference'
import { PathItemObjectRef } from '@/schemas/v3.1/strict/ref-definitions'

export const CallbackObjectSchemaDefinition = Type.Record(
  Type.String(),
  /** A Path Item Object used to define a callback request and expected responses. A complete example is available. */
  Type.Union([PathItemObjectRef, reference(PathItemObjectRef)]),
)

export type CallbackObject = Static<typeof CallbackObjectSchemaDefinition>
