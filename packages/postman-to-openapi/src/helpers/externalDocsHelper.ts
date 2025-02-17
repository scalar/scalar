import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { PostmanCollection, Variable } from '../types'

// Constants for variable keys
const VARIABLE_KEYS = {
  URL: 'externalDocs.url',
  DESCRIPTION: 'externalDocs.description',
} as const

/**
 * Finds a specific variable in the collection by its key
 */
function findVariable(collection: PostmanCollection, key: string): Variable | undefined {
  return collection.variable?.find((v) => v.key === key)
}

/**
 * Processes the external documentation information from a Postman Collection.
 * This function checks for 'externalDocs.url' and 'externalDocs.description'
 * in the collection variables and creates an OpenAPI External Documentation Object
 * if the URL is present.
 */
export function processExternalDocs(
  collection: PostmanCollection,
): OpenAPIV3_1.ExternalDocumentationObject | undefined {
  try {
    const urlVariable = findVariable(collection, VARIABLE_KEYS.URL)
    const descriptionVariable = findVariable(collection, VARIABLE_KEYS.DESCRIPTION)

    if (!urlVariable?.value) {
      return undefined
    }

    if (typeof urlVariable.value !== 'string') {
      throw new Error('External docs URL must be a string')
    }

    return {
      url: urlVariable.value,
      ...(descriptionVariable?.value &&
        typeof descriptionVariable.value === 'string' && {
          description: descriptionVariable.value,
        }),
    }
  } catch (error) {
    console.error('Error processing external docs:', error)
    throw error
  }
}
