import { Type } from '@sinclair/typebox'
import { OAuthFlowObject } from './oauth-flow'

/**
 * Allows configuration of the supported OAuth Flows.
 */
export const OAuthFlowsObject = Type.Object({
  /** Configuration for the OAuth Implicit flow */
  implicit: Type.Optional(OAuthFlowObject),
  /** Configuration for the OAuth Resource Owner Password flow */
  password: Type.Optional(OAuthFlowObject),
  /** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
  clientCredentials: Type.Optional(OAuthFlowObject),
  /** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0. */
  authorizationCode: Type.Optional(OAuthFlowObject),
})
