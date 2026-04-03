import { faker } from '@faker-js/faker'
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

// A list of formats which are not supported by the faker.js generator
const UNSUPPORTED_FORMATS = ['int32', 'int64', 'float', 'double', 'byte']

/**
 * Generate an example value from a schema.
 */
export function getExampleFromSchema(
  schema: OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject,
  options?: {
    emptyBody?: boolean
    mode?: 'read' | 'write'
  },
): any {
  if (options?.emptyBody) {
    return ''
  }

  if (options?.mode === 'read' && schema.readOnly) {
    return
  }

  if (options?.mode === 'write' && schema.writeOnly) {
    return
  }

  // If there’s an example, use it.
  if (schema.example !== undefined) {
    return schema.example
  }

  // If there’s a default value, use it.
  if (schema.default !== undefined) {
    return schema.default
  }

  // If there are enum values, use the first one.
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[0]
  }

  // If the value is nullable, use null as the example
  if ((schema as OpenAPIV3.SchemaObject).nullable === true) {
    return null
  }
  // OpenAPI 3.1: check for `type: ['integer', 'null']`
  if (Array.isArray(schema.type) && schema.type.includes('null')) {
    return null
  }

  // If there’s a format, use it.
  if (
    schema.format &&
    !UNSUPPORTED_FORMATS.includes(schema.format) &&
    !schema.type?.includes('integer') &&
    !schema.type?.includes('number')
  ) {
    if (faker.helpers.schema.hasFormat(schema.format)) {
      return faker.helpers.schema.fromExample({
        ...schema,
        type: schema.type ?? 'string',
      })
    }
  }

  // And finally, use the type.
  if (schema.type) {
    if (schema.type === 'object') {
      const example: { [key: string]: any } = {}
      if (schema.properties) {
        for (const key in schema.properties) {
          example[key] = getExampleFromSchema(
            schema.properties[key] as OpenAPIV3.SchemaObject,
            options,
          )
        }
      }
      return example
    } else if (schema.type === 'array') {
      if (schema.items) {
        return [
          getExampleFromSchema(
            schema.items as OpenAPIV3.SchemaObject,
            options,
          ),
        ]
      } else {
        return []
      }
    } else if (schema.type === 'string') {
      // If the schema has a default value, we’ll use it.
      if (schema.default) {
        return schema.default
      }

      // If the schema has an example, we’ll use it.
      if (schema.example) {
        return schema.example
      }

      // Check for enums
      if (Array.isArray(schema.enum) && schema.enum.length > 0) {
        return schema.enum[0]
      }

      // Check for format
      if (schema.format) {
        if (faker.helpers.schema.hasFormat(schema.format)) {
          return faker.helpers.schema.fromExample({
            ...schema,
            type: 'string',
          })
        }
      }

      return 'string'
    } else if (schema.type === 'number' || schema.type === 'integer') {
      return 0
    } else if (schema.type === 'boolean') {
      return false
    }
  }

  return ''
}
