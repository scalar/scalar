import { Type } from '@scalar/typebox'

import { AmqpBindingRef, HttpBindingRef, KafkaBindingRef, MqttBindingRef, WebSocketBindingRef } from './ref-definitions'

/**
 * Binding Schema - Protocol-specific bindings.
 * A map where keys represent the protocol (http, ws, kafka, amqp, mqtt, etc.) and values are the protocol-specific binding information.
 */
export const BindingSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([
    HttpBindingRef,
    WebSocketBindingRef,
    KafkaBindingRef,
    AmqpBindingRef,
    MqttBindingRef,
    Type.Any(), // Fallback for other/custom protocols
  ]),
)

/**
 * Binding Schema - Protocol-specific bindings.
 * A map where keys represent the protocol (http, ws, kafka, amqp, mqtt, etc.) and values are the protocol-specific binding information.
 */
export type Binding = {
  /** Protocol-specific binding information. */
  [key: string]: any
}
