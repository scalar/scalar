import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { PostmanCollection } from '../types'
import { processContact } from './contact'
import { processLicense } from './license'

type InfoResult = {
  license?: OpenAPIV3_1.LicenseObject
  contact?: OpenAPIV3_1.ContactObject
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
