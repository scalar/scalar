/**
 * AsyncAPI broker security scheme type names, grouped by the credential shape they share.
 *
 * These sets are the single source of truth for the runtime type guards used both when extracting
 * stored secrets and when rendering the credential inputs, so the two stay in sync.
 */

/** SASL-style broker schemes: all of them authenticate with a username + password pair. */
const SASL_SCHEME_TYPES = ['userPassword', 'plain', 'scramSha256', 'scramSha512'] as const

export type SaslSchemeType = (typeof SASL_SCHEME_TYPES)[number]

export const isSaslSchemeType = (type: string | undefined): type is SaslSchemeType =>
  Boolean(type) && (SASL_SCHEME_TYPES as readonly string[]).includes(type!)

/** Encryption broker schemes: a single key value. */
const ENCRYPTION_SCHEME_TYPES = ['symmetricEncryption', 'asymmetricEncryption'] as const

export type EncryptionSchemeType = (typeof ENCRYPTION_SCHEME_TYPES)[number]

export const isEncryptionSchemeType = (type: string | undefined): type is EncryptionSchemeType =>
  Boolean(type) && (ENCRYPTION_SCHEME_TYPES as readonly string[]).includes(type!)
