import { Type } from '@scalar/typebox'

import {
  type OAuthFlowAuthorizationCodeObject,
  OAuthFlowAuthorizationCodeSchema,
  type OAuthFlowClientCredentialsObject,
  OAuthFlowClientCredentialsSchema,
  type OAuthFlowImplicitObject,
  OAuthFlowImplicitSchema,
  type OAuthFlowPasswordObject,
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
  implicit?: OAuthFlowImplicitObject
  /** Configuration for the OAuth Resource Owner Protected Credentials flow */
  password?: OAuthFlowPasswordObject
  /** Configuration for the OAuth Client Credentials flow */
  clientCredentials?: OAuthFlowClientCredentialsObject
  /** Configuration for the OAuth Authorization Code flow */
  authorizationCode?: OAuthFlowAuthorizationCodeObject
}
