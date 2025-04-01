// TODO: Use the new names everywhere, keep the name of the export.
// ✅ SecurityRequirementObjectSchema
// ❌ oasSecurityRequirementSchema
export {
  type Oauth2Flow,
  type Oauth2FlowPayload,
  type SecuritySchemaHttp,
  type SecuritySchemaOpenId,
  type SecurityScheme,
  type SecuritySchemeApiKey,
  type SecuritySchemeOauth2,
  type SecuritySchemeOauth2Payload,
  type SecuritySchemePayload,
  SecurityRequirementObjectSchema as oasSecurityRequirementSchema,
  SecuritySchemeObjectSchema as oasSecuritySchemeSchema,
  XUsePkceValues as pkceOptions,
  ApiKeySchema as securityApiKeySchema,
  HttpSchema as securityHttpSchema,
  OAuthFlowsObject as securityOauthSchema,
  OpenIdConnectSchema as securityOpenIdSchema,
  SecuritySchemeObjectSchema as securitySchemeSchema,
} from './security-scheme.ts'
