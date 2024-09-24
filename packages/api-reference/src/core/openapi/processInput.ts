import { redirectToProxy } from '@scalar/oas-utils/helpers'
import { dereference, load } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { createEmptySpecification } from '../../helpers'

type ProxyOption = {
  proxy?: string
}

/**
 * WIP
 */
export function processInput(
  input: Record<string, any>,
  { proxy }: ProxyOption = {},
) {
  return new Promise((resolve, reject) => {
    // Return an empty resolved specification if the given specification is empty
    if (!input) {
      return resolve(createEmptySpecification() as OpenAPIV3_1.Document)
    }

    return load(input, {
      plugins: [
        fetchUrls({
          fetch: (url) => fetch(proxy ? redirectToProxy(proxy, url) : url),
        }),
      ],
    })
      .then(({ filesystem }) => dereference(filesystem))
      .then(({ schema, errors }) => {
        if (errors?.length) {
          console.warn(
            'Please open an issue on https://github.com/scalar/scalar\n',
            'Scalar OpenAPI Parser Warning:\n',
            errors,
          )
        }

        if (schema === undefined) {
          reject(errors?.[0]?.message ?? 'Failed to parse the OpenAPI file.')
          return resolve(createEmptySpecification() as OpenAPIV3_1.Document)
        }

        return resolve(schema)
      })
      .catch((error) => {
        return reject(error)
      })
  })
}
