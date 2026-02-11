import { Type } from '@scalar/typebox'

/**
 * Protocol-specific information for a Redis server.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export const RedisServerBindingSchemaDefinition = Type.Object({})

/**
 * Protocol-specific information for a Redis channel.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export const RedisChannelBindingSchemaDefinition = Type.Object({})
