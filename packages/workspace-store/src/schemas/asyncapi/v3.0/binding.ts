import { Type } from '@scalar/typebox'

import { AmqpBindingRef, HttpBindingRef, KafkaBindingRef, MqttBindingRef, WebSocketBindingRef } from './ref-definitions'

/**
 * Base Binding Schema - Protocol-specific bindings.
 * A map where keys represent the protocol (http, ws, kafka, amqp, mqtt, etc.) and values are the protocol-specific binding information.
 */
const BindingBaseSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([HttpBindingRef, WebSocketBindingRef, KafkaBindingRef, AmqpBindingRef, MqttBindingRef, Type.Any()]),
)

/**
 * Server Bindings Object - Protocol-specific bindings for servers.
 */
export const ServerBindingsObjectSchemaDefinition = BindingBaseSchemaDefinition

/**
 * Server Bindings Object - Protocol-specific bindings for servers.
 */
export type ServerBindingsObject = {
  /** Protocol-specific binding information for servers. */
  [key: string]: any
}

/**
 * Channel Bindings Object - Protocol-specific bindings for channels.
 */
export const ChannelBindingsObjectSchemaDefinition = BindingBaseSchemaDefinition

/**
 * Channel Bindings Object - Protocol-specific bindings for channels.
 */
export type ChannelBindingsObject = {
  /** Protocol-specific binding information for channels. */
  [key: string]: any
}

/**
 * Operation Bindings Object - Protocol-specific bindings for operations.
 */
export const OperationBindingsObjectSchemaDefinition = BindingBaseSchemaDefinition

/**
 * Operation Bindings Object - Protocol-specific bindings for operations.
 */
export type OperationBindingsObject = {
  /** Protocol-specific binding information for operations. */
  [key: string]: any
}

/**
 * Message Bindings Object - Protocol-specific bindings for messages.
 */
export const MessageBindingsObjectSchemaDefinition = BindingBaseSchemaDefinition

/**
 * Message Bindings Object - Protocol-specific bindings for messages.
 */
export type MessageBindingsObject = {
  /** Protocol-specific binding information for messages. */
  [key: string]: any
}

// Legacy export for backward compatibility
/** @deprecated Use specific binding object types instead */
export const BindingSchemaDefinition = BindingBaseSchemaDefinition

/** @deprecated Use specific binding object types instead */
export type Binding = ServerBindingsObject
