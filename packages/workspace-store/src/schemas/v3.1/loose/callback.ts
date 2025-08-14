import { Type, type TSchema } from '@sinclair/typebox'
import { ReferenceObjectSchema } from './reference'

export const callbackObjectSchemaBuilder = <P extends TSchema>(pathItem: P) =>
  Type.Record(
    Type.String(),
    /** A Path Item Object used to define a callback request and expected responses. A complete example is available. */
    Type.Union([pathItem, ReferenceObjectSchema]),
  )
