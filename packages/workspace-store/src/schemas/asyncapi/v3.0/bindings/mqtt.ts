import { Type } from '@scalar/typebox'

/**
 * Protocol-specific information for an MQTT server.
 */
export const MqttBindingSchemaDefinition = Type.Object({
  /** Defines the Quality of Service (QoS) levels for the message flow. */
  qos: Type.Optional(Type.Union([Type.Literal(0), Type.Literal(1), Type.Literal(2)])),
  /** Whether the message should be retained by the broker. */
  retain: Type.Optional(Type.Boolean()),
  /** The version of this binding. */
  bindingVersion: Type.Optional(Type.String()),
})

/**
 * Protocol-specific information for an MQTT server.
 */
export type MqttBinding = {
  /** Defines the Quality of Service (QoS) levels for the message flow. 0 = At most once, 1 = At least once, 2 = Exactly once. */
  qos?: 0 | 1 | 2
  /** Whether the message should be retained by the broker. */
  retain?: boolean
  /** The version of this binding. */
  bindingVersion?: string
}
