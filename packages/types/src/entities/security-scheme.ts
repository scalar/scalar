import { z } from 'zod'

import { type ENTITY_BRANDS, nanoidSchema } from '@/utils/nanoid.ts'

const extendedSecuritySchema = z.object({
  uid: nanoidSchema.brand<ENTITY_BRANDS['SECURITY_SCHEME']>(),
  /** The name key that links a security requirement to a security object */
  nameKey: z.string().optional().default(''),
})

// API KEY

const apiKeyValueSchema = z.object({
  value: z.string().default(''),
})

export const securityApiKeySchema = oasSecuritySchemeApiKey.merge(extendedSecuritySchema).merge(apiKeyValueSchema)
export type SecuritySchemeApiKey = z.infer<typeof securityApiKeySchema>

// HTTP

const httpValueSchema = z.object({
  username: z.string().default(''),
  password: z.string().default(''),
  token: z.string().default(''),
})

export const securityHttpSchema = oasSecuritySchemeHttp.merge(extendedSecuritySchema).merge(httpValueSchema)
export type SecuritySchemaHttp = z.infer<typeof securityHttpSchema>

// OPENID CONNECT

export const securityOpenIdSchema = oasSecuritySchemeOpenId.merge(extendedSecuritySchema)
export type SecuritySchemaOpenId = z.infer<typeof securityOpenIdSchema>

export const securityOauthSchema = oasSecuritySchemeOauth2.merge(extendedSecuritySchema)

export type SecuritySchemeOauth2 = z.infer<typeof securityOauthSchema>
export type SecuritySchemeOauth2Payload = z.input<typeof securityOauthSchema>
export type Oauth2Flow = NonNullable<
  SecuritySchemeOauth2['flows']['authorizationCode' | 'clientCredentials' | 'implicit' | 'password']
>
/** Payload for the oauth 2 flows + extensions */
export type Oauth2FlowPayload = NonNullable<SecuritySchemeOauth2Payload['flows']>[
  | 'authorizationCode'
  | 'clientCredentials'
  | 'implicit'
  | 'password'] &
  Record<`x-${string}`, string>

// Final Types

/** Extended security schemes for workspace usage */
export const securitySchemeSchema = z.union([
  securityApiKeySchema,
  securityHttpSchema,
  securityOpenIdSchema,
  securityOauthSchema,
])

/**
 * Security Scheme Object
 *
 * @see https://spec.openapis.org/oas/latest.html#security-scheme-object
 */
export type SecurityScheme = z.infer<typeof securitySchemeSchema>
export type SecuritySchemePayload = z.input<typeof securitySchemeSchema>
