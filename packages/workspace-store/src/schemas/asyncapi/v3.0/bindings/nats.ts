import { Type } from '@scalar/typebox'

/**
 * Protocol-specific information for a NATS operation.
 */
export const NatsOperationBindingSchemaDefinition = Type.Object({
  /** Defines the name of the queue to use. It MUST NOT exceed 255 characters. */
  queue: Type.Optional(Type.String({ maxLength: 255 })),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for a NATS operation.
 */
export type NatsOperationBinding = {
  /** Defines the name of the queue to use. It MUST NOT exceed 255 characters. */
  queue?: string
  /** The version of this binding. */
  bindingVersion?: string
}
