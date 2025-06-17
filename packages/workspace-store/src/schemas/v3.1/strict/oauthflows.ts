import { Type, type Static } from '@sinclair/typebox'
import { OAuthFlowObjectSchema } from './oauth-flow'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { compose } from '@/schemas/v3.1/compose'

/**
 * Allows configuration of the supported OAuth Flows.
 */
export const OAuthFlowsObjectSchema = compose(
  Type.Object({
    /** Configuration for the OAuth Implicit flow */
    implicit: Type.Optional(OAuthFlowObjectSchema),
    /** Configuration for the OAuth Resource Owner Password flow */
    password: Type.Optional(OAuthFlowObjectSchema),
    /** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
    clientCredentials: Type.Optional(OAuthFlowObjectSchema),
    /** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0. */
    authorizationCode: Type.Optional(OAuthFlowObjectSchema),
  }),
  ExtensionsSchema,
)

export type OAuthFlowsObject = Static<typeof OAuthFlowsObjectSchema>
