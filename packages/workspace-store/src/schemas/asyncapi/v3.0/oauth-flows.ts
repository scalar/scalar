import { Type } from '@scalar/typebox'

import {
  type OAuthFlowAuthorizationCode,
  OAuthFlowAuthorizationCodeSchema,
  type OAuthFlowClientCredentials,
  OAuthFlowClientCredentialsSchema,
  type OAuthFlowImplicit,
  OAuthFlowImplicitSchema,
  type OAuthFlowPassword,
  OAuthFlowPasswordSchema,
} from './oauth-flow'

/**
 * Allows configuration of the supported OAuth Flows.
 */
export const OAuthFlowsObjectSchemaDefinition = Type.Object({
  /** Configuration for the OAuth Implicit flow */
  implicit: Type.Optional(OAuthFlowImplicitSchema),
  /** Configuration for the OAuth Resource Owner Protected Credentials flow */
  password: Type.Optional(OAuthFlowPasswordSchema),
  /** Configuration for the OAuth Client Credentials flow */
  clientCredentials: Type.Optional(OAuthFlowClientCredentialsSchema),
  /** Configuration for the OAuth Authorization Code flow */
  authorizationCode: Type.Optional(OAuthFlowAuthorizationCodeSchema),
})

export type OAuthFlowsObject = {
  /** Configuration for the OAuth Implicit flow */
  implicit?: OAuthFlowImplicit
  /** Configuration for the OAuth Resource Owner Protected Credentials flow */
  password?: OAuthFlowPassword
  /** Configuration for the OAuth Client Credentials flow */
  clientCredentials?: OAuthFlowClientCredentials
  /** Configuration for the OAuth Authorization Code flow */
  authorizationCode?: OAuthFlowAuthorizationCode
}
