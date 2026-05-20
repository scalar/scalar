import { type Schema, object, optional, unknown } from '@scalar/validation'

/**
 * Protocol keys listed for binding objects in AsyncAPI 3.1.0. Values are
 * protocol-specific; we accept any JSON-compatible structure.
 */
const ASYNCAPI_3_1_BINDING_PROTOCOL_KEYS = [
  'http',
  'ws',
  'kafka',
  'anypointmq',
  'amqp',
  'amqp1',
  'mqtt',
  'mqtt5',
  'nats',
  'jms',
  'sns',
  'solace',
  'sqs',
  'stomp',
  'redis',
  'mercure',
  'ibmmq',
  'googlepubsub',
  'pulsar',
  'ros2',
] as const

const optionalBindingPayload = (): Schema =>
  optional(
    unknown({
      typeComment: 'Protocol-specific binding definition (see AsyncAPI protocol bindings).',
    }),
  )

const bindingObjectProperties = (): Record<string, Schema> => {
  const properties: Record<string, Schema> = {}
  for (const key of ASYNCAPI_3_1_BINDING_PROTOCOL_KEYS) {
    properties[key] = optionalBindingPayload()
  }
  return properties
}

const makeBindingsObject = (typeName: string, typeComment: string) =>
  object(bindingObjectProperties(), { typeName, typeComment })

export const asyncApiServerBindingsObject = makeBindingsObject(
  'AsyncApiServerBindingsObject',
  'Map describing protocol-specific definitions for a server (AsyncAPI 3.1.0).',
)

export const asyncApiChannelBindingsObject = makeBindingsObject(
  'AsyncApiChannelBindingsObject',
  'Map describing protocol-specific definitions for a channel (AsyncAPI 3.1.0).',
)

export const asyncApiOperationBindingsObject = makeBindingsObject(
  'AsyncApiOperationBindingsObject',
  'Map describing protocol-specific definitions for an operation (AsyncAPI 3.1.0).',
)

export const asyncApiMessageBindingsObject = makeBindingsObject(
  'AsyncApiMessageBindingsObject',
  'Map describing protocol-specific definitions for a message (AsyncAPI 3.1.0).',
)
