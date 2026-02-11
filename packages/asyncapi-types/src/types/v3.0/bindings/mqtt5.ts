import type { SchemaObject } from '@/openapi-types/v3.1/strict/schema'

/**
 * Protocol-specific information for an MQTT 5 channel.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export type Mqtt5ChannelBinding = Record<string, never>

/**
 * Protocol-specific information for an MQTT 5 server.
 * Note: MQTT 5 specific bindings are deprecated in favor of MQTT bindings that are not version specific.
 */
export type Mqtt5ServerBinding = {
  /** Session Expiry Interval in seconds or a Schema Object containing the definition of the interval. */
  sessionExpiryInterval?: number | SchemaObject
  /** The version of this binding. */
  bindingVersion?: string
}
