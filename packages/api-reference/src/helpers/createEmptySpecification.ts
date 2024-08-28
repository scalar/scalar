import type { OpenAPI } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'

import { deepMerge } from './deepMerge'

/**
 * Creates an empty specification object.
 * The returning object has the same structure as a valid OpenAPI specification, but everything is empty.
 */
export function createEmptySpecification(
  partialSpecification?: Partial<OpenAPI.Document>,
) {
  return deepMerge(partialSpecification ?? {}, {
    info: {
      title: '',
      description: '',
      termsOfService: '',
      version: '',
      license: {
        name: '',
        url: '',
      },
      contact: {
        email: '',
      },
    },
    externalDocs: {
      description: '',
      url: '',
    },
    servers: [],
    tags: [],
  }) as Spec
}
