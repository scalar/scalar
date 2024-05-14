import type { Spec } from '../types'

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
