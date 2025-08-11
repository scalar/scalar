import { Type, type TSchema } from '@sinclair/typebox'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/compose'
import { reference } from '@/schemas/v3.1/strict/reference'

export const callbackObjectSchemaBuilder = <P extends TSchema>(pathItem: P) =>
  compose(
    Type.Record(
      Type.String(),
      /** A Path Item Object used to define a callback request and expected responses. A complete example is available. */
      Type.Union([pathItem, reference(pathItem)]),
    ),
    ExtensionsSchema,
  )
