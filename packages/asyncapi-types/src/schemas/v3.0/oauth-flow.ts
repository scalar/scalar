import { Type } from '@scalar/typebox'

import { compose } from '@/helpers/compose'

/**
 * Common properties used across all AsyncAPI OAuth flows.
 * Note: AsyncAPI uses availableScopes instead of scopes.
 */
const OAuthFlowCommonSchema = Type.Object({
  /** The URL to be used for obtaining refresh tokens. This MUST be in the form of an absolute URL. */
  refreshUrl: Type.Optional(Type.String()),
  /** REQUIRED. The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. */
  availableScopes: Type.Record(Type.String(), Type.String()),
})

/** Configuration for the OAuth Implicit flow */
export const OAuthFlowImplicitSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of an absolute URL. */
    authorizationUrl: Type.String(),
  }),
)

/** Configuration for the OAuth Resource Owner Protected Credentials flow */
export const OAuthFlowPasswordSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of an absolute URL. */
    tokenUrl: Type.String(),
  }),
)

/** Configuration for the OAuth Client Credentials flow */
export const OAuthFlowClientCredentialsSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of an absolute URL. */
    tokenUrl: Type.String(),
  }),
)

/** Configuration for the OAuth Authorization Code flow */
export const OAuthFlowAuthorizationCodeSchema = compose(
  OAuthFlowCommonSchema,
  Type.Object({
    /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of an absolute URL. */
    authorizationUrl: Type.String(),
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of an absolute URL. */
    tokenUrl: Type.String(),
  }),
)

/** Union of all OAuth flow schemas */
export const OAuthFlowObjectSchemaDefinition = Type.Union([
  OAuthFlowImplicitSchema,
  OAuthFlowPasswordSchema,
  OAuthFlowClientCredentialsSchema,
  OAuthFlowAuthorizationCodeSchema,
])
