import type { ReferenceType } from '@/openapi-types/v3.1/strict/reference'

import type { MessageObject } from './message'

/**
 * An object to hold a map of Message Objects. This map can be referenced by name.
 */
export type MessagesObject = Record<string, ReferenceType<MessageObject>>
