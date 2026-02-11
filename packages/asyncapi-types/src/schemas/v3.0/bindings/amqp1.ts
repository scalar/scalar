import { Type } from '@scalar/typebox'

/**
 * Protocol-specific information for an AMQP 1.0 server.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export const Amqp1ServerBindingSchemaDefinition = Type.Object({})

/**
 * Protocol-specific information for an AMQP 1.0 channel.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export const Amqp1ChannelBindingSchemaDefinition = Type.Object({})
