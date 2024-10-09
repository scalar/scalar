import type { AnyObject } from '../types'
import { traverse } from './traverse'

/**
 * Upgrade from OpenAPI 3.0.x to 3.1.0
 *
 * https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
 */
export function upgradeFromThreeToThreeOne(originalSpecification: AnyObject) {
  let specification = structuredClone(originalSpecification)

  // Version
  if (specification.openapi?.startsWith('3.0')) {
    specification.openapi = '3.1.0'
  } else {
    // Skip if it’s something else than 3.0.x
    return specification
  }

  // Nullable types
  specification = traverse(specification, (schema) => {
    if (schema.type !== 'undefined' && schema.nullable === true) {
      schema.type = ['null', schema.type]
      delete schema.nullable
    }

    return schema
  })

  // exclusiveMinimum and exclusiveMaximum
  specification = traverse(specification, (schema) => {
    if (schema.exclusiveMinimum === true) {
      schema.exclusiveMinimum = schema.minimum
      delete schema.minimum
    } else if (schema.exclusiveMinimum === false) {
      delete schema.exclusiveMinimum
    }

    if (schema.exclusiveMaximum === true) {
      schema.exclusiveMaximum = schema.maximum
      delete schema.maximum
    } else if (schema.exclusiveMaximum === false) {
      delete schema.exclusiveMaximum
    }

    return schema
  })

  // Use examples not example
  specification = traverse(specification, (schema, path) => {
    if (schema.example !== undefined) {
      // Arrays in schemas
      if (isSchemaPath(path)) {
        schema.examples = [schema.example]
      }
      // Objects everywhere else
      else {
        schema.examples = {
          default: schema.example,
        }
      }
      delete schema.example
    }

    return schema
  })

  // Multipart file uploads with a binary file
  specification = traverse(specification, (schema) => {
    if (schema.type === 'object' && schema.properties !== undefined) {
      // Types
      const entries: [string, any][] = Object.entries(schema.properties)

      for (const [_, value] of entries) {
        if (
          typeof value === 'object' &&
          value.type === 'string' &&
          value.format === 'binary'
        ) {
          value.contentEncoding = 'application/octet-stream'
          delete value.format
        }
      }
    }

    return schema
  })

  // Uploading a binary file in a POST request
  specification = traverse(specification, (schema) => {
    if (schema.type === 'string' && schema.format === 'binary') {
      return undefined
    }

    return schema
  })

  // Uploading an image with base64 encoding
  specification = traverse(specification, (schema) => {
    if (schema.type === 'string' && schema.format === 'base64') {
      return {
        type: 'string',
        contentEncoding: 'base64',
      }
    }

    return schema
  })

  // Declaring $schema Dialects to protect against change
  // if (typeof specification.$schema === 'undefined') {
  //   specification.$schema = 'http://json-schema.org/draft-07/schema#'
  // }

  return specification
}

/** Determine if the current path is within a schema */
export function isSchemaPath(path: string[]): boolean {
  const schemaLocations = [
    ['components', 'schemas'],
    'properties',
    'items',
    'allOf',
    'anyOf',
    'oneOf',
    'not',
    'additionalProperties',
  ]

  return (
    schemaLocations.some((location) => {
      if (Array.isArray(location)) {
        return location.every((segment, index) => path[index] === segment)
      }
      return path.includes(location)
    }) ||
    path.includes('schema') ||
    path.some((segment) => segment.endsWith('Schema'))
  )
}
