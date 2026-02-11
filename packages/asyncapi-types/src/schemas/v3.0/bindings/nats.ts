import { Type } from '@scalar/typebox'

/**
 * Protocol-specific information for a NATS server.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export const NatsServerBindingSchemaDefinition = Type.Object({})

/**
 * Protocol-specific information for a NATS channel.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export const NatsChannelBindingSchemaDefinition = Type.Object({})

/**
 * Protocol-specific information for a NATS operation.
 */
export const NatsOperationBindingSchemaDefinition = Type.Object({
  /** Defines the name of the queue to use. It MUST NOT exceed 255 characters. */
  queue: Type.Optional(Type.String({ maxLength: 255 })),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})
