import { isObjectLike } from '@scalar/helpers/object/is-object'

/** Credential fields that can be cleared or reset without changing a security scheme. */
export type AuthSecretField =
  | 'x-scalar-secret-client-id'
  | 'x-scalar-secret-client-secret'
  | 'x-scalar-secret-password'
  | 'x-scalar-secret-redirect-uri'
  | 'x-scalar-secret-token'
  | 'x-scalar-secret-refresh-token'
  | 'x-scalar-secret-username'
  | 'x-scalar-secret-auth-url'
  | 'x-scalar-secret-token-url'

const clearedFieldsKey = 'x-scalar-secret-cleared-fields'

const getClearedFields = (secrets: object): string[] => {
  const fields: unknown = Reflect.get(secrets, clearedFieldsKey)
  return Array.isArray(fields) ? fields.filter((field): field is string => typeof field === 'string') : []
}

/** Legacy empty credentials still inherit defaults; only an explicit clear overrides them. */
export const isSecretFieldCleared = (secrets: object, field: string): boolean =>
  getClearedFields(secrets).includes(field)

/** Record clear intent from the update, rather than from empty values filled by the store schema. */
export const updateClearedSecretFields = (secrets: Record<string, unknown>, update: Record<string, unknown>): void => {
  const cleared = new Set(getClearedFields(secrets))
  for (const [field, value] of Object.entries(update)) {
    if (field.startsWith('x-scalar-secret-') && field !== clearedFieldsKey && typeof value === 'string') {
      if (value === '') {
        cleared.add(field)
      } else {
        cleared.delete(field)
      }
    } else if (isObjectLike(value) && isObjectLike(secrets[field])) {
      updateClearedSecretFields(secrets[field], value)
    }
  }
  if (cleared.size) {
    secrets[clearedFieldsKey] = [...cleared]
  } else {
    delete secrets[clearedFieldsKey]
  }
}

/** Release one override so its current document or configured default can take effect. */
export const resetSecretField = (secrets: Record<string, unknown>, field: AuthSecretField): void => {
  delete secrets[field]
  const cleared = getClearedFields(secrets).filter((value) => value !== field)
  if (cleared.length) {
    secrets[clearedFieldsKey] = cleared
  } else {
    delete secrets[clearedFieldsKey]
  }
}
