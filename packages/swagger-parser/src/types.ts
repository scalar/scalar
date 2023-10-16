import { type OpenAPIV2, type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'

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
  components?: OpenAPIV3.ComponentsObject | OpenAPIV3_1.ComponentsObject
  definitions?: OpenAPIV2.DefinitionsObject
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
