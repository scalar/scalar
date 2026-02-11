/**
 * Protocol-specific information for a NATS operation.
 */
export type NatsOperationBinding = {
  /** Defines the name of the queue to use. It MUST NOT exceed 255 characters. */
  queue?: string
  /** The version of this binding. */
  bindingVersion?: string
}
