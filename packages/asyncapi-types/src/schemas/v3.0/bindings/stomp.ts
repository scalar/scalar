import { Type } from '@scalar/typebox'

/**
 * Protocol-specific information for a STOMP server.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export const StompServerBindingSchemaDefinition = Type.Object({})

/**
 * Protocol-specific information for a STOMP channel.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export const StompChannelBindingSchemaDefinition = Type.Object({})
