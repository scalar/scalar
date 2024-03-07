import { type Spec } from "@scalar/api-reference";

// Generate a new empty spec instance
export const emptySpecGenerator = (): Spec => ({
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
    components: {
      schemas: {},
      securitySchemes: {},
    },
    servers: [],
    tags: [],
  })
