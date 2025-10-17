import { type TSchema, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { extensions } from '@/schemas/extensions'
import { type XTagGroups, XTagGroupsSchema } from '@/schemas/extensions/tag/x-tag-groups'
import {
  TraversedDescriptionSchemaDefinition,
  type TraversedEntry,
  TraversedEntrySchemaDefinition,
  TraversedOperationSchemaDefinition,
  TraversedSchemaSchemaDefinition,
  TraversedTagSchemaDefinition,
  TraversedWebhookSchemaDefinition,
} from '@/schemas/navigation'
import {
  type XScalarClientConfigCookies,
  xScalarClientConfigCookiesSchema,
} from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-cookies'
import {
  type XScalarClientConfigEnvironments,
  xScalarClientConfigEnvironmentsSchema,
} from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-environments'
import { ContactObjectSchemaDefinition } from '@/schemas/v3.1/strict/contact'
import { DiscriminatorObjectSchemaDefinition } from '@/schemas/v3.1/strict/discriminator'
import {
  type ExternalDocumentationObject,
  ExternalDocumentationObjectSchemaDefinition,
} from '@/schemas/v3.1/strict/external-documentation'
import { type InfoObject, InfoObjectSchemaDefinition } from '@/schemas/v3.1/strict/info'
import { LicenseObjectSchemaDefinition } from '@/schemas/v3.1/strict/license'
import {
  ExternalDocumentationObjectRef,
  InfoObjectRef,
  REF_DEFINITIONS,
  SecurityRequirementObjectRef,
  TagObjectRef,
  TraversedEntryObjectRef,
} from '@/schemas/v3.1/strict/ref-definitions'
import { SchemaObjectSchemaDefinition } from '@/schemas/v3.1/strict/schema'
import {
  type SecurityRequirementObject,
  SecurityRequirementObjectSchemaDefinition,
} from '@/schemas/v3.1/strict/security-requirement'
import { type TagObject, TagObjectSchemaDefinition } from '@/schemas/v3.1/strict/tag'
import { XMLObjectSchemaDefinition } from '@/schemas/v3.1/strict/xml'

import {
  ChannelBindingsObjectSchemaDefinition,
  MessageBindingsObjectSchemaDefinition,
  OperationBindingsObjectSchemaDefinition,
  ServerBindingsObjectSchemaDefinition,
} from './binding'
import {
  AmqpChannelBindingSchemaDefinition,
  AmqpMessageBindingSchemaDefinition,
  AmqpOperationBindingSchemaDefinition,
} from './bindings/amqp'
import { HttpMessageBindingSchemaDefinition, HttpOperationBindingSchemaDefinition } from './bindings/http'
import {
  KafkaChannelBindingSchemaDefinition,
  KafkaMessageBindingSchemaDefinition,
  KafkaOperationBindingSchemaDefinition,
  KafkaServerBindingSchemaDefinition,
} from './bindings/kafka'
import {
  MqttMessageBindingSchemaDefinition,
  MqttOperationBindingSchemaDefinition,
  MqttServerBindingSchemaDefinition,
} from './bindings/mqtt'
import { WebSocketChannelBindingSchemaDefinition } from './bindings/websocket'
import { ChannelObjectSchemaDefinition } from './channel-item'
import type { ChannelsObject } from './channels'
import { ChannelsObjectSchemaDefinition } from './channels'
import { ComponentsObjectSchemaDefinition } from './components'
import { CorrelationIdObjectSchemaDefinition } from './correlation-id'
import { MessageObjectSchemaDefinition } from './message'
import { MessageExampleObjectSchemaDefinition } from './message-example'
import { MessageTraitObjectSchemaDefinition } from './message-trait'
import { MessagesObjectSchemaDefinition } from './messages'
import { MultiFormatSchemaObjectSchemaDefinition } from './multi-format-schema'
import { OAuthFlowObjectSchemaDefinition } from './oauth-flow'
import { OAuthFlowsObjectSchemaDefinition } from './oauth-flows'
import { OperationSchemaDefinition } from './operation'
import { OperationTraitObjectSchemaDefinition } from './operation-trait'
import type { OperationsObject } from './operations'
import { OperationsObjectSchemaDefinition } from './operations'
import { ParameterObjectSchemaDefinition } from './parameter'
import { ParametersObjectSchemaDefinition } from './parameters'
import {
  ASYNCAPI_REF_DEFINITIONS,
  ChannelsObjectRef,
  ComponentsObjectRef,
  OperationsObjectRef,
  ServersObjectRef,
} from './ref-definitions'
import { ReplyObjectSchemaDefinition } from './reply'
import { ReplyAddressObjectSchemaDefinition } from './reply-address'
import { SecuritySchemeObjectSchemaDefinition } from './security-scheme'
import { ServerObjectSchemaDefinition, ServerVariableObjectSchemaDefinition } from './server'
import type { ServersObject } from './servers'
import { ServersObjectSchemaDefinition } from './servers'
import { TagsObjectSchemaDefinition } from './tags'

// AsyncAPI Extensions Schema
const AsyncApiExtensionsSchema = Type.Partial(
  compose(
    Type.Object({
      'x-scalar-client-config-active-environment': Type.String(),
      /** A custom icon representing the collection */
      'x-scalar-client-config-icon': Type.String(),
      'x-scalar-client-config-environments': xScalarClientConfigEnvironmentsSchema,
      'x-scalar-client-config-cookies': xScalarClientConfigCookiesSchema,
      'x-original-asyncapi-version': Type.String(),
      'x-scalar-selected-security': Type.Optional(Type.Array(SecurityRequirementObjectRef)),
      [extensions.document.navigation]: Type.Array(TraversedEntryObjectRef),
    }),
    XTagGroupsSchema,
  ),
)

export type AsyncApiExtensions = Partial<
  {
    'x-scalar-client-config-active-environment': string
    /** A custom icon representing the collection */
    'x-scalar-client-config-icon': string
    'x-scalar-client-config-environments': XScalarClientConfigEnvironments
    'x-scalar-client-config-cookies': XScalarClientConfigCookies
    'x-original-asyncapi-version': string
    'x-scalar-selected-security': SecurityRequirementObject[]
    [extensions.document.navigation]: TraversedEntry[]
  } & XTagGroups
>

// AsyncAPI Document Schema Definition
const AsyncApiDocumentSchemaDefinition = compose(
  Type.Object({
    /** REQUIRED. This string MUST be the version number of the AsyncAPI Specification that the AsyncAPI Document uses. The asyncapi field SHOULD be used by tooling to interpret the AsyncAPI Document. This is not related to the API info.version string. */
    asyncapi: Type.String(),
    /** REQUIRED. Provides metadata about the API. The metadata MAY be used by tooling as required. */
    info: InfoObjectRef,
    /** The default value for the $schema keyword within Schema Objects contained within this AsyncAPI document. This MUST be in the form of a URI. */
    jsonSchemaDialect: Type.Optional(Type.String()),
    /** A map of Server Objects, which provide connectivity information to a target server. */
    servers: Type.Optional(ServersObjectRef),
    /** The available channels and operations for the API. */
    channels: Type.Optional(ChannelsObjectRef),
    /** The operations supported by the API. */
    operations: Type.Optional(OperationsObjectRef),
    /** An element to hold various Objects for the AsyncAPI Description. */
    components: Type.Optional(ComponentsObjectRef),
    /** A declaration of which security mechanisms can be used across the API. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. Individual operations can override this definition. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
    security: Type.Optional(Type.Array(SecurityRequirementObjectRef)),
    /** A list of tags used by the AsyncAPI Description with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Not all tags that are used by the Operation Object must be declared. The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique. */
    tags: Type.Optional(Type.Array(TagObjectRef)),
    /** Additional external documentation. */
    externalDocs: Type.Optional(ExternalDocumentationObjectRef),
    /** Identifier of the default content type the API is using for the message payloads. */
    defaultContentType: Type.Optional(Type.String()),
  }),
  AsyncApiExtensionsSchema,
)

export type AsyncApiDocument = {
  /** REQUIRED. This string MUST be the version number of the AsyncAPI Specification that the AsyncAPI Document uses. The asyncapi field SHOULD be used by tooling to interpret the AsyncAPI Document. This is not related to the API info.version string. */
  asyncapi: '3.0.0'
  /** REQUIRED. Provides metadata about the API. The metadata MAY be used by tooling as required. */
  info: InfoObject
  /** The default value for the $schema keyword within Schema Objects contained within this AsyncAPI document. This MUST be in the form of a URI. */
  jsonSchemaDialect?: string
  /** A map of Server Objects, which provide connectivity information to a target server. */
  servers?: ServersObject
  /** The available channels and operations for the API. */
  channels?: ChannelsObject
  /** The operations supported by the API. */
  operations?: OperationsObject
  /** An element to hold various Objects for the AsyncAPI Description. */
  components?: import('./components').ComponentsObject
  /** A declaration of which security mechanisms can be used across the API. The list of values includes alternative Security Requirement Objects that can be used. Only one of the Security Requirement Objects need to be satisfied to authorize a request. Individual operations can override this definition. The list can be incomplete, up to being empty or absent. To make security explicitly optional, an empty security requirement ({}) can be included in the array. */
  security?: SecurityRequirementObject[]
  /** A list of tags used by the AsyncAPI Description with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Not all tags that are used by the Operation Object must be declared. The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique. */
  tags?: TagObject[]
  /** Additional external documentation. */
  externalDocs?: ExternalDocumentationObject
  /** Identifier of the default content type the API is using for the message payloads. */
  defaultContentType?: string
} & AsyncApiExtensions

// ----- Module Definition ----
const module = Type.Module({
  // Reused OpenAPI objects
  [REF_DEFINITIONS.SecurityRequirementObject]: SecurityRequirementObjectSchemaDefinition,
  [REF_DEFINITIONS.TagObject]: TagObjectSchemaDefinition,
  [REF_DEFINITIONS.ExternalDocumentationObject]: ExternalDocumentationObjectSchemaDefinition,
  [REF_DEFINITIONS.InfoObject]: InfoObjectSchemaDefinition,
  [REF_DEFINITIONS.ContactObject]: ContactObjectSchemaDefinition,
  [REF_DEFINITIONS.LicenseObject]: LicenseObjectSchemaDefinition,
  [REF_DEFINITIONS.SchemaObject]: SchemaObjectSchemaDefinition,
  [REF_DEFINITIONS.DiscriminatorObject]: DiscriminatorObjectSchemaDefinition,
  [REF_DEFINITIONS.XMLObject]: XMLObjectSchemaDefinition,

  // AsyncAPI-specific objects
  [ASYNCAPI_REF_DEFINITIONS.ChannelObject]: ChannelObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.ChannelsObject]: ChannelsObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.Operation]: OperationSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.OperationsObject]: OperationsObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.MessageObject]: MessageObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.MessageTraitObject]: MessageTraitObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.MessageExampleObject]: MessageExampleObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.ParameterObject]: ParameterObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.CorrelationIdObject]: CorrelationIdObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.OperationTraitObject]: OperationTraitObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.ReplyObject]: ReplyObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.ReplyAddressObject]: ReplyAddressObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.ServerObject]: ServerObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.ServerVariableObject]: ServerVariableObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.ParametersObject]: ParametersObjectSchemaDefinition,

  // Binding objects
  [ASYNCAPI_REF_DEFINITIONS.ServerBindingsObject]: ServerBindingsObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.ChannelBindingsObject]: ChannelBindingsObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.OperationBindingsObject]: OperationBindingsObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.MessageBindingsObject]: MessageBindingsObjectSchemaDefinition,

  // Protocol-specific bindings
  // AMQP
  [ASYNCAPI_REF_DEFINITIONS.AmqpChannelBinding]: AmqpChannelBindingSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.AmqpOperationBinding]: AmqpOperationBindingSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.AmqpMessageBinding]: AmqpMessageBindingSchemaDefinition,
  // HTTP
  [ASYNCAPI_REF_DEFINITIONS.HttpOperationBinding]: HttpOperationBindingSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.HttpMessageBinding]: HttpMessageBindingSchemaDefinition,
  // WebSocket
  [ASYNCAPI_REF_DEFINITIONS.WebSocketChannelBinding]: WebSocketChannelBindingSchemaDefinition,
  // Kafka
  [ASYNCAPI_REF_DEFINITIONS.KafkaServerBinding]: KafkaServerBindingSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.KafkaChannelBinding]: KafkaChannelBindingSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.KafkaOperationBinding]: KafkaOperationBindingSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.KafkaMessageBinding]: KafkaMessageBindingSchemaDefinition,
  // MQTT
  [ASYNCAPI_REF_DEFINITIONS.MqttServerBinding]: MqttServerBindingSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.MqttOperationBinding]: MqttOperationBindingSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.MqttMessageBinding]: MqttMessageBindingSchemaDefinition,

  // Multi-format schemas
  [ASYNCAPI_REF_DEFINITIONS.MultiFormatSchemaObject]: MultiFormatSchemaObjectSchemaDefinition,

  // Security
  [ASYNCAPI_REF_DEFINITIONS.SecuritySchemeObject]: SecuritySchemeObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.OAuthFlowsObject]: OAuthFlowsObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.OAuthFlowObject]: OAuthFlowObjectSchemaDefinition,

  // Components
  [ASYNCAPI_REF_DEFINITIONS.ComponentsObject]: ComponentsObjectSchemaDefinition,

  // Object maps
  [ASYNCAPI_REF_DEFINITIONS.ServersObject]: ServersObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.MessagesObject]: MessagesObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.TagsObject]: TagsObjectSchemaDefinition,

  // Document
  AsyncApiDocument: AsyncApiDocumentSchemaDefinition,

  // Navigation schemas
  [REF_DEFINITIONS.TraversedDescriptionObject]: TraversedDescriptionSchemaDefinition,
  [REF_DEFINITIONS.TraversedOperationObject]: TraversedOperationSchemaDefinition,
  [REF_DEFINITIONS.TraversedSchemaObject]: TraversedSchemaSchemaDefinition,
  [REF_DEFINITIONS.TraversedWebhookObject]: TraversedWebhookSchemaDefinition,
  [REF_DEFINITIONS.TraversedTagObject]: TraversedTagSchemaDefinition,
  [REF_DEFINITIONS.TraversedEntryObject]: TraversedEntrySchemaDefinition,
} satisfies Record<string, TSchema>)

// ----- Schemas ----
export const AsyncApiDocumentSchema = module.Import('AsyncApiDocument')

export const SecurityRequirementObjectSchema = module.Import('SecurityRequirementObject')
export const TagObjectSchema = module.Import('TagObject')

export const ExternalDocumentationObjectSchema = module.Import('ExternalDocumentationObject')

export const InfoObjectSchema = module.Import('InfoObject')
export const ContactObjectSchema = module.Import('ContactObject')
export const LicenseObjectSchema = module.Import('LicenseObject')

// AsyncAPI-specific schema exports
export const ServerObjectSchema = module.Import('ServerObject')
export const ServerVariableObjectSchema = module.Import('ServerVariableObject')
export const ChannelObjectSchema = module.Import('ChannelObject')
export const ChannelsObjectSchema = module.Import('ChannelsObject')
export const CorrelationIdObjectSchema = module.Import('CorrelationIdObject')
export const MessageObjectSchema = module.Import('MessageObject')
export const MessageTraitObjectSchema = module.Import('MessageTraitObject')
export const MessageExampleObjectSchema = module.Import('MessageExampleObject')
export const OperationSchema = module.Import('Operation')
export const OperationTraitObjectSchema = module.Import('OperationTraitObject')
export const OperationsObjectSchema = module.Import('OperationsObject')
export const ParameterObjectSchema = module.Import('ParameterObject')
export const ParametersObjectSchema = module.Import('ParametersObject')
export const ReplyObjectSchema = module.Import('ReplyObject')
export const ReplyAddressObjectSchema = module.Import('ReplyAddressObject')
export const MultiFormatSchemaObjectSchema = module.Import('MultiFormatSchemaObject')
export const ServersObjectSchema = module.Import('ServersObject')
export const MessagesObjectSchema = module.Import('MessagesObject')
export const TagsObjectSchema = module.Import('TagsObject')
export const ComponentsObjectSchema = module.Import('ComponentsObject')

// Binding object exports
export const ServerBindingsObjectSchema = module.Import('ServerBindingsObject')
export const ChannelBindingsObjectSchema = module.Import('ChannelBindingsObject')
export const OperationBindingsObjectSchema = module.Import('OperationBindingsObject')
export const MessageBindingsObjectSchema = module.Import('MessageBindingsObject')

// Security exports
export const SecuritySchemeObjectSchema = module.Import('SecuritySchemeObject')
export const OAuthFlowsObjectSchema = module.Import('OAuthFlowsObject')
export const OAuthFlowObjectSchema = module.Import('OAuthFlowObject')

// Protocol-specific binding exports
// AMQP
export const AmqpChannelBindingSchema = module.Import('AmqpChannelBinding')
export const AmqpOperationBindingSchema = module.Import('AmqpOperationBinding')
export const AmqpMessageBindingSchema = module.Import('AmqpMessageBinding')
// HTTP
export const HttpOperationBindingSchema = module.Import('HttpOperationBinding')
export const HttpMessageBindingSchema = module.Import('HttpMessageBinding')
// WebSocket
export const WebSocketChannelBindingSchema = module.Import('WebSocketChannelBinding')
// Kafka
export const KafkaServerBindingSchema = module.Import('KafkaServerBinding')
export const KafkaChannelBindingSchema = module.Import('KafkaChannelBinding')
export const KafkaOperationBindingSchema = module.Import('KafkaOperationBinding')
export const KafkaMessageBindingSchema = module.Import('KafkaMessageBinding')
// MQTT
export const MqttServerBindingSchema = module.Import('MqttServerBinding')
export const MqttOperationBindingSchema = module.Import('MqttOperationBinding')
export const MqttMessageBindingSchema = module.Import('MqttMessageBinding')

export const TraversedDescriptionSchema = module.Import('TraversedDescriptionObject')
export const TraversedEntrySchema = module.Import('TraversedEntryObject')
export const TraversedTagSchema = module.Import('TraversedTagObject')
export const TraversedOperationSchema = module.Import('TraversedOperationObject')
export const TraversedSchemaSchema = module.Import('TraversedSchemaObject')
export const TraversedWebhookSchema = module.Import('TraversedWebhookObject')

// ----- Type re-exports ----
export type { ExternalDocumentationObject }
export type { InfoObject }
export type { SecurityRequirementObject }
export type { TagObject }

export type { ComponentsObject } from '@/schemas/v3.1/strict/components'
export type { ContactObject } from '@/schemas/v3.1/strict/contact'
export type { LicenseObject } from '@/schemas/v3.1/strict/license'

// AsyncAPI-specific type exports
export type { ChannelObject } from './channel-item'
export type { CorrelationIdObject } from './correlation-id'
export type { MessageObject } from './message'
export type { MessageExampleObject } from './message-example'
export type { MessageTraitObject } from './message-trait'
export type {
  OAuthFlowAuthorizationCodeObject,
  OAuthFlowClientCredentialsObject,
  OAuthFlowImplicitObject,
  OAuthFlowObject,
  OAuthFlowPasswordObject,
} from './oauth-flow'
export type { OAuthFlowsObject } from './oauth-flows'
export type { OperationAction, OperationObject } from './operation'
export type { OperationTraitObject } from './operation-trait'
export type { ParameterObject } from './parameter'
export type { ReplyObject } from './reply'
export type { ReplyAddressObject } from './reply-address'
export type {
  ApiKeyObject,
  AsymmetricEncryptionObject,
  GssapiObject,
  HttpApiKeyObject,
  HttpObject,
  OAuth2Object,
  OpenIdConnectObject,
  PlainObject,
  ScramSha256Object,
  ScramSha512Object,
  SecuritySchemeObject,
  SymmetricEncryptionObject,
  UserPasswordObject,
  X509Object,
} from './security-scheme'
export type { ServerObject, ServerVariableObject } from './server'
