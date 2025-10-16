import { Type } from '@scalar/typebox'

import { type ReferenceType, reference } from '@/schemas/v3.1/strict/reference'

import type { Message } from './message'
import { MessageRef } from './ref-definitions'

/**
 * An object to hold a map of Message Objects. This map can be referenced by name.
 */
export const MessagesObjectSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([MessageRef, reference(MessageRef)]),
)

/**
 * An object to hold a map of Message Objects. This map can be referenced by name.
 */
export type MessagesObject = Record<string, ReferenceType<Message>>
