import type { OpenAPIV3 } from '@scalar/openapi-types'

import type { PostmanCollection } from '../types'

/**
 * Processes the external documentation information from a Postman Collection.
 * This function checks for 'externalDocs.url' and 'externalDocs.description' in the collection variables
 * and creates an OpenAPI External Documentation Object if the URL is present.
 *
 * @param {PostmanCollection} collection - The Postman Collection to process
 * @returns {OpenAPIV3.ExternalDocumentationObject | undefined} The External Documentation Object if a URL is found, otherwise undefined
 */
export function processExternalDocs(
  collection: PostmanCollection,
): OpenAPIV3.ExternalDocumentationObject | undefined {
  // Check if externalDocs information is present in the collection variables
  const urlVariable = collection.variable?.find(
    (v) => v.key === 'externalDocs.url',
  )
  const descriptionVariable = collection.variable?.find(
    (v) => v.key === 'externalDocs.description',
  )

  if (urlVariable?.value) {
    return {
      url: urlVariable.value as string,
      ...(descriptionVariable?.value && {
        description: descriptionVariable.value as string,
      }),
    }
  }

  return undefined
}
