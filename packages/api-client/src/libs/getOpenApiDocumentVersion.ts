import { json, yaml } from '@scalar/oas-utils/helpers'

import { isDocument } from './isDocument'

/**
 * Get the Swagger/OpenAPI version and format from the given string
 */
export function getOpenApiDocumentVersion(input: string | null) {
  if (!isDocument(input)) {
    return false
  }

  try {
    const result = json.parse(input ?? '')

    if (typeof result?.openapi === 'string') {
      return { version: `OpenAPI ${result.openapi}`, type: 'json' }
    }

    if (typeof result?.swagger === 'string') {
      return { version: `Swagger ${result.swagger}`, type: 'json' }
    }

    return false
  } catch {
    //
  }

  try {
    const result = yaml.parse(input ?? '')

    if (typeof result?.openapi === 'string') {
      return { version: `OpenAPI ${result.openapi}`, type: 'yaml' }
    }

    if (typeof result?.swagger === 'string') {
      return { version: `Swagger ${result.swagger}`, type: 'yaml' }
    }

    return false
  } catch {
    //
  }

  return false
}
