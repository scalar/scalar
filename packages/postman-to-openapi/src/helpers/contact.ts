import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { PostmanCollection, Variable } from '@/types'

// Constants for contact variable keys
const VARIABLE_KEYS = {
  NAME: 'contact.name',
  URL: 'contact.url',
  EMAIL: 'contact.email',
} as const

/**
 * Finds a specific variable in the collection by its key
 */
function findVariable(collection: PostmanCollection, key: string): Variable | undefined {
  return collection.variable?.find((v) => v.key === key)
}

/**
 * Processes contact information from collection variables.
 * Returns an OpenAPI Contact Object if at least one contact field is present.
 */
export function processContact(collection: PostmanCollection): OpenAPIV3_1.ContactObject | undefined {
  const nameVar = findVariable(collection, VARIABLE_KEYS.NAME)
  const urlVar = findVariable(collection, VARIABLE_KEYS.URL)
  const emailVar = findVariable(collection, VARIABLE_KEYS.EMAIL)

  if (!nameVar?.value && !urlVar?.value && !emailVar?.value) {
    return undefined
  }

  return {
    ...(nameVar?.value && typeof nameVar.value === 'string' && { name: nameVar.value }),
    ...(urlVar?.value && typeof urlVar.value === 'string' && { url: urlVar.value }),
    ...(emailVar?.value && typeof emailVar.value === 'string' && { email: emailVar.value }),
  }
}
