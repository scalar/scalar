import type { MapOfStringsObject } from './map-of-strings'
/**
 * Oauth Flow object
 *
 * Configuration details for a supported OAuth Flow
 *
 * @see {@link https://spec.openapis.org/oas/v3.1#oauth-flow-object}
 */
export type ImplicitObject = {
  /** **REQUIRED**. The authorization URL to be used for this flow. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
  authorizationUrl: string
  /** The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL. The OAuth2 standard requires the use of TLS. */
  refreshUrl?: string
  /** **REQUIRED**. The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. The map MAY be empty. */
  scopes: MapOfStringsObject
} & Record<`x-${string}`, unknown>
