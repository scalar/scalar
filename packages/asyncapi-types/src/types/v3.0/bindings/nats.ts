/**
 * Protocol-specific information for a NATS server.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export type NatsServerBinding = Record<string, never>

/**
 * Protocol-specific information for a NATS channel.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export type NatsChannelBinding = Record<string, never>

/**
 * Protocol-specific information for a NATS operation.
 */
export type NatsOperationBinding = {
  /** Defines the name of the queue to use. It MUST NOT exceed 255 characters. */
  queue?: string
  /** The version of this binding. */
  bindingVersion?: string
}
