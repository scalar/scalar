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

import { BindingSchemaDefinition } from './binding'
import { AmqpBindingSchemaDefinition } from './bindings/amqp'
import { HttpBindingSchemaDefinition } from './bindings/http'
import { KafkaBindingSchemaDefinition } from './bindings/kafka'
import { MqttBindingSchemaDefinition } from './bindings/mqtt'
import { WebSocketBindingSchemaDefinition } from './bindings/websocket'
import { ChannelItemSchemaDefinition } from './channel-item'
import type { ChannelsObject } from './channels'
import { ChannelsObjectSchemaDefinition } from './channels'
import { ComponentsObjectSchemaDefinition } from './components'
import { CorrelationIdSchemaDefinition } from './correlation-id'
import { MessageSchemaDefinition } from './message'
import { MessageExampleSchemaDefinition } from './message-example'
import { MessageTraitSchemaDefinition } from './message-trait'
import { MessagesObjectSchemaDefinition } from './messages'
import { MultiFormatSchemaSchemaDefinition } from './multi-format-schema'
import { OAuthFlowObjectSchemaDefinition } from './oauth-flow'
import { OAuthFlowsObjectSchemaDefinition } from './oauth-flows'
import { OperationSchemaDefinition } from './operation'
import { OperationTraitSchemaDefinition } from './operation-trait'
import type { OperationsObject } from './operations'
import { OperationsObjectSchemaDefinition } from './operations'
import { ParameterSchemaDefinition } from './parameter'
import { ASYNCAPI_REF_DEFINITIONS } from './ref-definitions'
import { ReplySchemaDefinition } from './reply'
import { ReplyAddressSchemaDefinition } from './reply-address'
import { SecuritySchemeObjectSchemaDefinition } from './security-scheme'
import { ServerSchemaDefinition, ServerVariableSchemaDefinition } from './server'
import type { ServersObject } from './servers'
import { ServersObjectSchemaDefinition } from './servers'

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
    servers: Type.Optional(ServersObjectSchemaDefinition),
    /** The available channels and operations for the API. */
    channels: Type.Optional(ChannelsObjectSchemaDefinition),
    /** The operations supported by the API. */
    operations: Type.Optional(OperationsObjectSchemaDefinition),
    /** An element to hold various Objects for the AsyncAPI Description. */
    components: Type.Optional(ComponentsObjectSchemaDefinition),
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
  [ASYNCAPI_REF_DEFINITIONS.ChannelItem]: ChannelItemSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.ChannelsObject]: ChannelsObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.Operation]: OperationSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.OperationsObject]: OperationsObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.Message]: MessageSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.MessageTrait]: MessageTraitSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.MessageExample]: MessageExampleSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.Parameter]: ParameterSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.CorrelationId]: CorrelationIdSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.OperationTrait]: OperationTraitSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.Reply]: ReplySchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.ReplyAddress]: ReplyAddressSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.Server]: ServerSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.ServerVariable]: ServerVariableSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.Binding]: BindingSchemaDefinition,

  // Protocol-specific bindings
  [ASYNCAPI_REF_DEFINITIONS.HttpBinding]: HttpBindingSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.WebSocketBinding]: WebSocketBindingSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.KafkaBinding]: KafkaBindingSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.AmqpBinding]: AmqpBindingSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.MqttBinding]: MqttBindingSchemaDefinition,

  // Multi-format schemas
  [ASYNCAPI_REF_DEFINITIONS.MultiFormatSchema]: MultiFormatSchemaSchemaDefinition,

  // Security
  [ASYNCAPI_REF_DEFINITIONS.SecuritySchemeObject]: SecuritySchemeObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.OAuthFlowsObject]: OAuthFlowsObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.OAuthFlowObject]: OAuthFlowObjectSchemaDefinition,

  // Components
  [ASYNCAPI_REF_DEFINITIONS.ComponentsObject]: ComponentsObjectSchemaDefinition,

  // Object maps
  [ASYNCAPI_REF_DEFINITIONS.ServersObject]: ServersObjectSchemaDefinition,
  [ASYNCAPI_REF_DEFINITIONS.MessagesObject]: MessagesObjectSchemaDefinition,

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
export const ServerSchema = module.Import('Server')
export const ServerVariableSchema = module.Import('ServerVariable')
export const BindingSchema = module.Import('Binding')
export const ChannelItemSchema = module.Import('ChannelItem')
export const ChannelsObjectSchema = module.Import('ChannelsObject')
export const CorrelationIdSchema = module.Import('CorrelationId')
export const MessageSchema = module.Import('Message')
export const MessageTraitSchema = module.Import('MessageTrait')
export const MessageExampleSchema = module.Import('MessageExample')
export const OperationSchema = module.Import('Operation')
export const OperationTraitSchema = module.Import('OperationTrait')
export const OperationsObjectSchema = module.Import('OperationsObject')
export const ParameterSchema = module.Import('Parameter')
export const ReplySchema = module.Import('Reply')
export const ReplyAddressSchema = module.Import('ReplyAddress')
export const MultiFormatSchemaSchema = module.Import('MultiFormatSchema')
export const ServersObjectSchema = module.Import('ServersObject')
export const MessagesObjectSchema = module.Import('MessagesObject')
export const ComponentsObjectSchema = module.Import('ComponentsObject')

// Security exports
export const SecuritySchemeObjectSchema = module.Import('SecuritySchemeObject')
export const OAuthFlowsObjectSchema = module.Import('OAuthFlowsObject')
export const OAuthFlowObjectSchema = module.Import('OAuthFlowObject')

// Protocol-specific binding exports
export const HttpBindingSchema = module.Import('HttpBinding')
export const WebSocketBindingSchema = module.Import('WebSocketBinding')
export const KafkaBindingSchema = module.Import('KafkaBinding')
export const AmqpBindingSchema = module.Import('AmqpBinding')
export const MqttBindingSchema = module.Import('MqttBinding')

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
export type { ChannelItem } from './channel-item'
export type { CorrelationId } from './correlation-id'
export type { Message } from './message'
export type { MessageExample } from './message-example'
export type { MessageTrait } from './message-trait'
export type {
  OAuthFlow,
  OAuthFlowAuthorizationCode,
  OAuthFlowClientCredentials,
  OAuthFlowImplicit,
  OAuthFlowPassword,
} from './oauth-flow'
export type { OAuthFlowsObject } from './oauth-flows'
export type { Operation, OperationAction } from './operation'
export type { OperationTrait } from './operation-trait'
export type { Parameter } from './parameter'
export type { Reply } from './reply'
export type { ReplyAddress } from './reply-address'
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
export type { Server, ServerVariable } from './server'
