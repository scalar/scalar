import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { PostmanCollection, Variable } from '../types'

// Constants for variable keys
const VARIABLE_KEYS = {
  LICENSE: {
    NAME: 'license.name',
    URL: 'license.url',
  },
  CONTACT: {
    NAME: 'contact.name',
    URL: 'contact.url',
    EMAIL: 'contact.email',
  },
} as const

type InfoResult = {
  license?: OpenAPIV3_1.LicenseObject
  contact?: OpenAPIV3_1.ContactObject
}

/**
 * Finds a specific variable in the collection by its key
 */
function findVariable(collection: PostmanCollection, key: string): Variable | undefined {
  return collection.variable?.find((v) => v.key === key)
}

/**
 * Processes license information from collection variables
 */
function processLicense(collection: PostmanCollection): OpenAPIV3_1.LicenseObject | undefined {
  const nameVar = findVariable(collection, VARIABLE_KEYS.LICENSE.NAME)
  if (!nameVar?.value || typeof nameVar.value !== 'string') {
    return undefined
  }

  const urlVar = findVariable(collection, VARIABLE_KEYS.LICENSE.URL)
  return {
    name: nameVar.value,
    ...(urlVar?.value && typeof urlVar.value === 'string' && { url: urlVar.value }),
  }
}

/**
 * Processes contact information from collection variables
 */
function processContact(collection: PostmanCollection): OpenAPIV3_1.ContactObject | undefined {
  const nameVar = findVariable(collection, VARIABLE_KEYS.CONTACT.NAME)
  const urlVar = findVariable(collection, VARIABLE_KEYS.CONTACT.URL)
  const emailVar = findVariable(collection, VARIABLE_KEYS.CONTACT.EMAIL)

  if (!nameVar?.value && !urlVar?.value && !emailVar?.value) {
    return undefined
  }

  return {
    ...(nameVar?.value && typeof nameVar.value === 'string' && { name: nameVar.value }),
    ...(urlVar?.value && typeof urlVar.value === 'string' && { url: urlVar.value }),
    ...(emailVar?.value && typeof emailVar.value === 'string' && { email: emailVar.value }),
  }
}

/**
 * Processes the license and contact information from a Postman Collection.
 * This function checks for license and contact related variables in the collection
 * and creates corresponding OpenAPI License and Contact Objects if the information is present.
 */
export function processLicenseAndContact(collection: PostmanCollection): InfoResult {
  try {
    const result: InfoResult = {}

    const license = processLicense(collection)
    if (license) {
      result.license = license
    }

    const contact = processContact(collection)
    if (contact) {
      result.contact = contact
    }

    return result
  } catch (error) {
    console.error('Error processing license and contact information:', error)
    throw error
  }
}
