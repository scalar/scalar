import { Type } from '@scalar/typebox'

import { PathItemObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import { reference } from '@/schemas/v3.1/strict/reference'

export const CallbackObjectSchemaDefinition = Type.Record(
  Type.String(),
  /** A Path Item Object used to define a callback request and expected responses. A complete example is available. */
  Type.Union([PathItemObjectRef, reference(PathItemObjectRef)]),
)
