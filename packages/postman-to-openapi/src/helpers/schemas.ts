import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Infers the schema of an OpenAPI object based on an example value.
 * This function recursively analyzes the structure of the example value
 * and returns a corresponding OpenAPI schema object.
 */
export function inferSchemaFromExample(example: any): OpenAPIV3_1.SchemaObject {
  if (Array.isArray(example)) {
    return {
      type: 'array',
      items: example.length > 0 ? inferSchemaFromExample(example[0]) : {},
    }
  }
  if (typeof example === 'object' && example !== null) {
    const properties: { [key: string]: OpenAPIV3_1.SchemaObject } = {}
    for (const [key, value] of Object.entries(example)) {
      properties[key] = inferSchemaFromExample(value)
    }
    return {
      type: 'object',
      properties,
    }
  }
  return {
    type: typeof example as OpenAPIV3_1.NonArraySchemaObjectType,
  }
}

/**
 * Infers the schema type of a value based on its type.
 * This function determines the OpenAPI schema type of a value
 * by checking its JavaScript type and attempting to parse it
 * as a number or boolean if it's a string.
 */
export function inferSchemaType(value: any): OpenAPIV3_1.SchemaObject {
  if (typeof value === 'number') {
    return { type: Number.isInteger(value) ? 'integer' : 'number' }
  }
  if (typeof value === 'boolean') {
    return { type: 'boolean' }
  }
  if (typeof value === 'string') {
    const num = Number(value)
    if (!isNaN(num)) {
      return { type: Number.isInteger(num) ? 'integer' : 'number' }
    }
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return { type: 'boolean' }
    }
  }
  return { type: 'string' }
}
