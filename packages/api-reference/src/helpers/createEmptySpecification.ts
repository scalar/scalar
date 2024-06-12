import type { Spec } from '@scalar/oas-utils'

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
