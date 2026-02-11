import { Type } from '@scalar/typebox'

import { SchemaObjectRef } from '@/openapi-types/v3.1/strict/ref-definitions'

/**
 * Protocol-specific information for an MQTT 5 channel.
 * This object MUST NOT contain any properties. Its name is reserved for future use.
 */
export const Mqtt5ChannelBindingSchemaDefinition = Type.Object({})

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
