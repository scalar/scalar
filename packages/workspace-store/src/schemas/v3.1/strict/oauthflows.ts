import { Type } from '@scalar/typebox'

import {
  OAuthFlowAuthorizationCodeSchema,
  OAuthFlowClientCredentialsSchema,
  OAuthFlowImplicitSchema,
  OAuthFlowPasswordSchema,
} from './oauth-flow'

/**
 * Allows configuration of the supported OAuth Flows.
 */
export const OAuthFlowsObjectSchemaDefinition = Type.Object({
  /** Configuration for the OAuth Implicit flow */
  implicit: Type.Optional(OAuthFlowImplicitSchema),
  /** Configuration for the OAuth Resource Owner Password flow */
  password: Type.Optional(OAuthFlowPasswordSchema),
  /** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
  clientCredentials: Type.Optional(OAuthFlowClientCredentialsSchema),
  /** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0. */
  authorizationCode: Type.Optional(OAuthFlowAuthorizationCodeSchema),
})
