import type { OAuthFlowsObject } from './index.generated'

export type {
  ApiKeySecuritySchemeObject,
  CallbackObject,
  ComponentsObject,
  ContactObject,
  DiscriminatorObject,
  EncodingObject,
  ExampleObject,
  ExternalDocumentationObject,
  HeaderObject,
  HttpSecuritySchemeObject,
  InfoObject,
  LicenseObject,
  LinkObject,
  MediaTypeObject,
  OAuth2SecuritySchemeObject,
  OAuthFlowsObject,
  OpenApiDocument,
  OpenIdConnectSecuritySchemeObject,
  OperationObject,
  ParameterObject,
  PathItemObject,
  PathsObject,
  RequestBodyObject,
  ResponseObject,
  ResponsesObject,
  SchemaObject,
  SecurityRequirementObject,
  SecuritySchemeObject,
  ServerObject,
  ServerVariableObject,
  TagObject,
  XMLObject,
} from './index.generated'

export type OAuthFlow = Exclude<
  OAuthFlowsObject['implicit' | 'password' | 'clientCredentials' | 'authorizationCode'],
  undefined
>
