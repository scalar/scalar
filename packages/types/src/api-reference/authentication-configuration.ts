import type { SecurityScheme } from '../entities/security-scheme'
import type { PartialDeep } from 'type-fest/source/partial-deep'

/**
 * Authentication configuration for the API reference.
 * This config is not validated so does not need a zod schema
 */
export type AuthenticationConfiguration = {
  /**
   * Specifies the preferred security scheme(s) to use for authentication.
   * Can be one of:
   * - A single security scheme name (string)
   * - An array of security scheme names (OR relationship)
   * - An array containing strings or arrays of strings (AND/OR relationship)
   */
  preferredSecurityScheme?: string | (string | string[])[] | null

  /**
   * Setting security schemes this way will allow you to override any value in your openapi document
   * You will also be able to set additional values such as api tokens etc.
   *
   * Set them via the nameKey in your components.securitySchemes.[nameKey]
   *
   * @example
   * ```ts
   * {
   *   authentication: {
   *     preferredSecurityScheme: 'apiKeyHeader',
   *     securitySchemes: {
   *       apiKeyHeader: {
   *         value: 'tokenValue'
   *       },
   *       httpBearer: {
   *         token: 'xyz token value'
   *       },
   *       httpBasic: {
   *         username: 'username',
   *         password: 'password'
   *       },
   *       oauth2: {
   *         flows: {
   *           authorizationCode: {
   *             token: 'auth code token'
   *           }
   *         }
   *       },
   *     },
   *   }
   * }
   * ```
   *
   */
  securitySchemes?: Record<string, PartialDeep<SecurityScheme>>
}
