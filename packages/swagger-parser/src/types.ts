export type SwaggerSpec = {
  info: {
    title: string
    description?: string
    version: string
    termsOfService: string
    contact: {
      email: string
    }
    license: {
      name: string
      url: string
    }
  }
  components?: {
    schemas?: Record<string, any>
  }
  tags: SwaggerTag[]
}

export type SwaggerTag = {
  name: string
  description?: string
  operations: SwaggerOperation[]
}

// TODO: types
export type SwaggerOperation = any

export type AnyObject = Record<string, any>

export type AnyStringOrObject = string | Record<string, any>
