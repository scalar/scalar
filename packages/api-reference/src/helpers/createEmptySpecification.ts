import type { Spec } from '@scalar/oas-utils'

/**
 * Creates an empty specification object.
 * The returning object has the same structure as a valid OpenAPI specification, but everything is empty.
 */
export function createEmptySpecification(): Spec {
  return {
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
  }
}
