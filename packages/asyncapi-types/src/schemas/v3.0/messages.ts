import { Type } from '@scalar/typebox'

import { reference } from '@/openapi-types/v3.1/strict/reference'

import { MessageObjectRef } from './ref-definitions'

/**
 * An object to hold a map of Message Objects. This map can be referenced by name.
 */
export const MessagesObjectSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([MessageObjectRef, reference(MessageObjectRef)]),
)
