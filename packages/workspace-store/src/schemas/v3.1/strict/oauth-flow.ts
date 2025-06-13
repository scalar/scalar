import { compose } from '@/schemas/v3.1/compose'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { Type, type Static } from '@sinclair/typebox'

/** Configuration details for a supported OAuth Flow */
export const OAuthFlowObjectSchema = compose(
  Type.Object({
    /** REQUIRED. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    authorizationUrl: Type.String(),
    /** REQUIRED. The token URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    tokenUrl: Type.String(),
    /** The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
    refreshUrl: Type.Optional(Type.String()),
    /** REQUIRED. The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. The map MAY be empty. */
    scopes: Type.Record(Type.String(), Type.String()),
  }),
  ExtensionsSchema,
)

export type OAuthFlowObject = Static<typeof OAuthFlowObjectSchema>
