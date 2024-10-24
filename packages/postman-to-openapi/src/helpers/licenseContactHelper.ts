import type { OpenAPIV3 } from '@scalar/openapi-types'

import type { PostmanCollection } from '../types'

/**
 * Processes the license and contact information from a Postman Collection.
 * This function checks for license and contact related variables in the collection
 * and creates corresponding OpenAPI License and Contact Objects if the information is present.
 *
 * @param {PostmanCollection} collection - The Postman Collection to process
 * @returns {{ license?: OpenAPIV3.LicenseObject, contact?: OpenAPIV3.ContactObject }}
 *          An object containing the License and Contact Objects if the information is found, otherwise undefined
 */
export function processLicenseAndContact(collection: PostmanCollection): {
  license?: OpenAPIV3.LicenseObject
  contact?: OpenAPIV3.ContactObject
} {
  const result: {
    license?: OpenAPIV3.LicenseObject
    contact?: OpenAPIV3.ContactObject
  } = {}

  if (collection.variable) {
    const licenseNameVar = collection.variable.find(
      (v) => v.key === 'license.name',
    )
    const licenseUrlVar = collection.variable.find(
      (v) => v.key === 'license.url',
    )
    const contactNameVar = collection.variable.find(
      (v) => v.key === 'contact.name',
    )
    const contactUrlVar = collection.variable.find(
      (v) => v.key === 'contact.url',
    )
    const contactEmailVar = collection.variable.find(
      (v) => v.key === 'contact.email',
    )

    if (licenseNameVar?.value) {
      result.license = {
        name: licenseNameVar.value as string,
        ...(licenseUrlVar?.value && { url: licenseUrlVar.value as string }),
      }
    }

    if (
      contactNameVar?.value ||
      contactUrlVar?.value ||
      contactEmailVar?.value
    ) {
      result.contact = {
        ...(contactNameVar?.value && { name: contactNameVar.value as string }),
        ...(contactUrlVar?.value && { url: contactUrlVar.value as string }),
        ...(contactEmailVar?.value && {
          email: contactEmailVar.value as string,
        }),
      }
    }
  }

  return result
}
