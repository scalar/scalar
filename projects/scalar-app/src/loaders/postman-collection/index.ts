import type { LoaderPlugin } from '@scalar/json-magic/bundle'

import { getOpenApiFromPostman } from './helpers/get-openapi-from-postman'
import { isPostmanCollection } from './helpers/is-postman-collection'

/**
 * Loader plugin for handling Postman collection input.
 *
 * This loader:
 * - Validates incoming JSON string to check if it is a Postman collection.
 * - Converts the Postman collection to an OpenAPI document using getOpenApiFromPostman.
 * - Returns an object with { ok: true, data, raw } if conversion is successful.
 * - Returns { ok: false } if validation or conversion fails.
 */
export const postmanCollection = (): LoaderPlugin => {
  return {
    type: 'loader',
    validate: isPostmanCollection,
    exec: (source: string) => {
      try {
        // Attempt to convert the source Postman collection JSON to an OpenAPI document
        const document = getOpenApiFromPostman(source)

        if (document) {
          // Successful conversion, return the OpenAPI document and original source
          return Promise.resolve({
            ok: true,
            data: document,
            raw: source,
          })
        }

        // Conversion failed, not a valid Postman collection or could not convert
        return Promise.resolve({ ok: false })
      } catch {
        // Catch any errors during validation or conversion
        return Promise.resolve({ ok: false })
      }
    },
  }
}
