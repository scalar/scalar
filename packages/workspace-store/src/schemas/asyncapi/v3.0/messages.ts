import { Type } from '@scalar/typebox'

import { type ReferenceType, reference } from '@/schemas/v3.1/strict/reference'

import type { MessageObject } from './message'
import { MessageObjectRef } from './ref-definitions'

/**
 * An object to hold a map of Message Objects. This map can be referenced by name.
 */
export const MessagesObjectSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([MessageObjectRef, reference(MessageObjectRef)]),
)

/**
 * An object to hold a map of Message Objects. This map can be referenced by name.
 */
export type MessagesObject = Record<string, ReferenceType<MessageObject>>
