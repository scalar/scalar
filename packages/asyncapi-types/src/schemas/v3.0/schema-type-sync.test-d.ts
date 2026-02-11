import type { Static } from '@scalar/typebox'
import type { RequiredDeep } from 'type-fest'
import { describe, expectTypeOf, it } from 'vitest'

import type { AsyncApiDocument } from '@/types/v3.0/asyncapi-document'
import type {
  ChannelBindingsObject,
  MessageBindingsObject,
  OperationBindingsObject,
  ServerBindingsObject,
} from '@/types/v3.0/binding'
import type { AmqpChannelBinding, AmqpMessageBinding, AmqpOperationBinding } from '@/types/v3.0/bindings/amqp'
import type { HttpMessageBinding, HttpOperationBinding } from '@/types/v3.0/bindings/http'
import type {
  KafkaChannelBinding,
  KafkaMessageBinding,
  KafkaOperationBinding,
  KafkaServerBinding,
} from '@/types/v3.0/bindings/kafka'
import type { MqttMessageBinding, MqttOperationBinding, MqttServerBinding } from '@/types/v3.0/bindings/mqtt'
import type { WebSocketChannelBinding } from '@/types/v3.0/bindings/websocket'
import type { ChannelObject } from '@/types/v3.0/channel-item'
import type { ChannelsObject } from '@/types/v3.0/channels'
import type { ComponentsObject } from '@/types/v3.0/components'
import type { CorrelationIdObject } from '@/types/v3.0/correlation-id'
import type { MessageObject } from '@/types/v3.0/message'
import type { MessageExampleObject } from '@/types/v3.0/message-example'
import type { MessageTraitObject } from '@/types/v3.0/message-trait'
import type { MessagesObject } from '@/types/v3.0/messages'
import type { MultiFormatSchemaObject } from '@/types/v3.0/multi-format-schema'
import type { OAuthFlowObject } from '@/types/v3.0/oauth-flow'
import type { OAuthFlowsObject } from '@/types/v3.0/oauth-flows'
import type { OperationObject } from '@/types/v3.0/operation'
import type { OperationTraitObject } from '@/types/v3.0/operation-trait'
import type { OperationsObject } from '@/types/v3.0/operations'
import type { ParameterObject } from '@/types/v3.0/parameter'
import type { ParametersObject } from '@/types/v3.0/parameters'
import type { ReplyObject } from '@/types/v3.0/reply'
import type { ReplyAddressObject } from '@/types/v3.0/reply-address'
import type { SecuritySchemeObject } from '@/types/v3.0/security-scheme'
import type { ServerObject, ServerVariableObject } from '@/types/v3.0/server'
import type { ServersObject } from '@/types/v3.0/servers'
import type { TagsObject } from '@/types/v3.0/tags'

// biome-ignore lint/style/useImportType: Schemas must be values for typeof in type assertions.
import {
  AmqpChannelBindingSchema,
  AmqpMessageBindingSchema,
  AmqpOperationBindingSchema,
  AsyncApiDocumentSchema,
  ChannelBindingsObjectSchema,
  ChannelObjectSchema,
  ChannelsObjectSchema,
  ComponentsObjectSchema,
  CorrelationIdObjectSchema,
  HttpMessageBindingSchema,
  HttpOperationBindingSchema,
  KafkaChannelBindingSchema,
  KafkaMessageBindingSchema,
  KafkaOperationBindingSchema,
  KafkaServerBindingSchema,
  MessageBindingsObjectSchema,
  MessageExampleObjectSchema,
  MessageObjectSchema,
  MessageTraitObjectSchema,
  MessagesObjectSchema,
  MqttMessageBindingSchema,
  MqttOperationBindingSchema,
  MqttServerBindingSchema,
  MultiFormatSchemaObjectSchema,
  OAuthFlowObjectSchema,
  OAuthFlowsObjectSchema,
  OperationBindingsObjectSchema,
  OperationSchema,
  OperationTraitObjectSchema,
  OperationsObjectSchema,
  ParameterObjectSchema,
  ParametersObjectSchema,
  ReplyAddressObjectSchema,
  ReplyObjectSchema,
  SecuritySchemeObjectSchema,
  ServerBindingsObjectSchema,
  ServerObjectSchema,
  ServerVariableObjectSchema,
  ServersObjectSchema,
  TagsObjectSchema,
  WebSocketChannelBindingSchema,
} from './asyncapi-document'

describe('schema-type sync', () => {
  it('AsyncApiDocumentSchema matches AsyncApiDocument', () => {
    expectTypeOf<RequiredDeep<Static<typeof AsyncApiDocumentSchema>>>().toEqualTypeOf<RequiredDeep<AsyncApiDocument>>()
  })

  it('ChannelObjectSchema matches ChannelObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof ChannelObjectSchema>>>().toEqualTypeOf<RequiredDeep<ChannelObject>>()
  })

  it('ChannelsObjectSchema matches ChannelsObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof ChannelsObjectSchema>>>().toEqualTypeOf<RequiredDeep<ChannelsObject>>()
  })

  it('ComponentsObjectSchema matches ComponentsObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof ComponentsObjectSchema>>>().toEqualTypeOf<RequiredDeep<ComponentsObject>>()
  })

  it('CorrelationIdObjectSchema matches CorrelationIdObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof CorrelationIdObjectSchema>>>().toEqualTypeOf<
      RequiredDeep<CorrelationIdObject>
    >()
  })

  it('MessageObjectSchema matches MessageObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof MessageObjectSchema>>>().toEqualTypeOf<RequiredDeep<MessageObject>>()
  })

  it('MessageExampleObjectSchema matches MessageExampleObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof MessageExampleObjectSchema>>>().toEqualTypeOf<
      RequiredDeep<MessageExampleObject>
    >()
  })

  it('MessageTraitObjectSchema matches MessageTraitObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof MessageTraitObjectSchema>>>().toEqualTypeOf<
      RequiredDeep<MessageTraitObject>
    >()
  })

  it('MessagesObjectSchema matches MessagesObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof MessagesObjectSchema>>>().toEqualTypeOf<RequiredDeep<MessagesObject>>()
  })

  it('MultiFormatSchemaObjectSchema matches MultiFormatSchemaObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof MultiFormatSchemaObjectSchema>>>().toEqualTypeOf<
      RequiredDeep<MultiFormatSchemaObject>
    >()
  })

  it('OAuthFlowObjectSchema matches OAuthFlowObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof OAuthFlowObjectSchema>>>().toEqualTypeOf<RequiredDeep<OAuthFlowObject>>()
  })

  it('OAuthFlowsObjectSchema matches OAuthFlowsObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof OAuthFlowsObjectSchema>>>().toEqualTypeOf<RequiredDeep<OAuthFlowsObject>>()
  })

  it('OperationSchema matches OperationObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof OperationSchema>>>().toEqualTypeOf<RequiredDeep<OperationObject>>()
  })

  it('OperationTraitObjectSchema matches OperationTraitObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof OperationTraitObjectSchema>>>().toEqualTypeOf<
      RequiredDeep<OperationTraitObject>
    >()
  })

  it('OperationsObjectSchema matches OperationsObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof OperationsObjectSchema>>>().toEqualTypeOf<RequiredDeep<OperationsObject>>()
  })

  it('ParameterObjectSchema matches ParameterObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof ParameterObjectSchema>>>().toEqualTypeOf<RequiredDeep<ParameterObject>>()
  })

  it('ParametersObjectSchema matches ParametersObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof ParametersObjectSchema>>>().toEqualTypeOf<RequiredDeep<ParametersObject>>()
  })

  it('ReplyObjectSchema matches ReplyObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof ReplyObjectSchema>>>().toEqualTypeOf<RequiredDeep<ReplyObject>>()
  })

  it('ReplyAddressObjectSchema matches ReplyAddressObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof ReplyAddressObjectSchema>>>().toEqualTypeOf<
      RequiredDeep<ReplyAddressObject>
    >()
  })

  it('SecuritySchemeObjectSchema matches SecuritySchemeObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof SecuritySchemeObjectSchema>>>().toEqualTypeOf<
      RequiredDeep<SecuritySchemeObject>
    >()
  })

  it('ServerObjectSchema matches ServerObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof ServerObjectSchema>>>().toEqualTypeOf<RequiredDeep<ServerObject>>()
  })

  it('ServerVariableObjectSchema matches ServerVariableObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof ServerVariableObjectSchema>>>().toEqualTypeOf<
      RequiredDeep<ServerVariableObject>
    >()
  })

  it('ServersObjectSchema matches ServersObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof ServersObjectSchema>>>().toEqualTypeOf<RequiredDeep<ServersObject>>()
  })

  it('TagsObjectSchema matches TagsObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof TagsObjectSchema>>>().toEqualTypeOf<RequiredDeep<TagsObject>>()
  })

  it('ChannelBindingsObjectSchema matches ChannelBindingsObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof ChannelBindingsObjectSchema>>>().toEqualTypeOf<
      RequiredDeep<ChannelBindingsObject>
    >()
  })

  it('MessageBindingsObjectSchema matches MessageBindingsObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof MessageBindingsObjectSchema>>>().toEqualTypeOf<
      RequiredDeep<MessageBindingsObject>
    >()
  })

  it('OperationBindingsObjectSchema matches OperationBindingsObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof OperationBindingsObjectSchema>>>().toEqualTypeOf<
      RequiredDeep<OperationBindingsObject>
    >()
  })

  it('ServerBindingsObjectSchema matches ServerBindingsObject', () => {
    expectTypeOf<RequiredDeep<Static<typeof ServerBindingsObjectSchema>>>().toEqualTypeOf<
      RequiredDeep<ServerBindingsObject>
    >()
  })

  it('AmqpChannelBindingSchema matches AmqpChannelBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof AmqpChannelBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<AmqpChannelBinding>
    >()
  })

  it('AmqpMessageBindingSchema matches AmqpMessageBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof AmqpMessageBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<AmqpMessageBinding>
    >()
  })

  it('AmqpOperationBindingSchema matches AmqpOperationBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof AmqpOperationBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<AmqpOperationBinding>
    >()
  })

  it('HttpMessageBindingSchema matches HttpMessageBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof HttpMessageBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<HttpMessageBinding>
    >()
  })

  it('HttpOperationBindingSchema matches HttpOperationBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof HttpOperationBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<HttpOperationBinding>
    >()
  })

  it('KafkaChannelBindingSchema matches KafkaChannelBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof KafkaChannelBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<KafkaChannelBinding>
    >()
  })

  it('KafkaMessageBindingSchema matches KafkaMessageBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof KafkaMessageBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<KafkaMessageBinding>
    >()
  })

  it('KafkaOperationBindingSchema matches KafkaOperationBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof KafkaOperationBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<KafkaOperationBinding>
    >()
  })

  it('KafkaServerBindingSchema matches KafkaServerBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof KafkaServerBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<KafkaServerBinding>
    >()
  })

  it('MqttMessageBindingSchema matches MqttMessageBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof MqttMessageBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<MqttMessageBinding>
    >()
  })

  it('MqttOperationBindingSchema matches MqttOperationBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof MqttOperationBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<MqttOperationBinding>
    >()
  })

  it('MqttServerBindingSchema matches MqttServerBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof MqttServerBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<MqttServerBinding>
    >()
  })

  it('WebSocketChannelBindingSchema matches WebSocketChannelBinding', () => {
    expectTypeOf<RequiredDeep<Static<typeof WebSocketChannelBindingSchema>>>().toEqualTypeOf<
      RequiredDeep<WebSocketChannelBinding>
    >()
  })
})
