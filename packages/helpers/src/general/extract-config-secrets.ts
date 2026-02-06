import { objectEntries } from '../object/object-entries'

/**
 * Mapping of field names to their corresponding x-scalar-secret extension names.
 */
const SECRET_FIELD_MAPPINGS = {
  clientSecret: 'x-scalar-secret-client-secret',
  password: 'x-scalar-secret-password',
  token: 'x-scalar-secret-token',
  username: 'x-scalar-secret-username',
  value: 'x-scalar-secret-token',
  'x-scalar-client-id': 'x-scalar-secret-client-id',
  'x-scalar-redirect-uri': 'x-scalar-secret-redirect-uri',
} as const

/**
 * Extracts secret fields from the config or the old schemes
 * Maps original field names to their x-scalar-secret extension equivalents.
 */
export const extractConfigSecrets = (input: Record<string, unknown>): Record<string, string> =>
  objectEntries(SECRET_FIELD_MAPPINGS).reduce<Record<string, string>>((result, [field, secretField]) => {
    const value = input[field]
    if (value && typeof value === 'string') {
      result[secretField] = value
    }
    return result
  }, {})

/** Set of all secret fields */
const SECRETS_SET = new Set<string>(
  objectEntries(SECRET_FIELD_MAPPINGS).flatMap(([oldSecret, newSecret]) => [oldSecret, newSecret]),
)

/** Removes all secret fields from the input object */
export const removeSecretFields = (input: Record<string, unknown>): Record<string, unknown> =>
  objectEntries(input).reduce<Record<string, unknown>>((result, [key, value]) => {
    if (!SECRETS_SET.has(key)) {
      result[key] = value
    }
    return result
  }, {})
