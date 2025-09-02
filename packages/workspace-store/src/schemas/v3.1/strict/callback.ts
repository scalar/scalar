import { Type } from '@scalar/typebox'
import { reference } from '@/schemas/v3.1/strict/reference'

export const CallbackObjectSchema = Type.Record(
  Type.String(),
  /** A Path Item Object used to define a callback request and expected responses. A complete example is available. */
  Type.Union([Type.Ref('PathItem'), reference(Type.Ref('PathItem'))]),
)
