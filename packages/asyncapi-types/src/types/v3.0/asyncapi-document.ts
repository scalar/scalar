import type { ExternalDocumentationObject } from '@/openapi-types/v3.1/strict/external-documentation'
import type { InfoObject } from '@/openapi-types/v3.1/strict/info'
import type { SecurityRequirementObject } from '@/openapi-types/v3.1/strict/security-requirement'
import type { TagObject } from '@/openapi-types/v3.1/strict/tag'

import type { ChannelsObject } from './channels'
import type { OperationsObject } from './operations'
import type { ServersObject } from './servers'

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
}

export type { ExternalDocumentationObject }
export type { InfoObject }
export type { SecurityRequirementObject }
export type { TagObject }

export type { ComponentsObject } from '@/openapi-types/v3.1/strict/components'
export type { ContactObject } from '@/openapi-types/v3.1/strict/contact'
export type { LicenseObject } from '@/openapi-types/v3.1/strict/license'

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
