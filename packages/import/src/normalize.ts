import { normalize as normalizeDocument, upgrade } from '@scalar/openapi-parser'

import { resolve } from './resolve'

/**
 * Pass any URL, Scalar API Reference, Postman collection, Swagger 2.0 document URL … and retrieve an OpenAPI 3.1 document.
 */
export async function normalize(input: any) {
  // Try to find a document URL
  const openApiDocumentUrl = await resolve(input)

  if (!openApiDocumentUrl) {
    console.error('Could not find an OpenAPI document URL')
    return undefined
  }

  // Fetch the content
  // TODO: Skip this step if we have the content already
  const result = await fetch(openApiDocumentUrl)

  // Error handling
  if (!result.ok) {
    console.error(
      'Failed to fetch the OpenAPI document',
      `Tried to fetch ${openApiDocumentUrl}, but received ${result.status} ${result.statusText}`,
    )

    return undefined
  }

  // Make it an object
  const content = normalizeDocument(await result.text())

  // TODO: Add @scalar/postman-to-openapi here

  // Upgrade to OpenAPI 3.1
  const { specification } = upgrade(content)

  return specification
}
