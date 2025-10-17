import { Type } from '@scalar/typebox'

import { SchemaObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import type { SchemaObject } from '@/schemas/v3.1/strict/schema'

/**
 * Protocol-specific information for an MQTT 5 server.
 * Note: MQTT 5 specific bindings are deprecated in favor of MQTT bindings that are not version specific.
 */
export const Mqtt5ServerBindingSchemaDefinition = Type.Object({
  /** Session Expiry Interval in seconds or a Schema Object containing the definition of the interval. */
  sessionExpiryInterval: Type.Optional(Type.Union([Type.Integer(), SchemaObjectRef])),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

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
