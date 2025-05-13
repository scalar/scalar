import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'
import { getSchemas } from './get-schemas'

describe('get-schemas', () => {
  const EXAMPLE_DOCUMENT: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            message: { type: 'string' },
          },
        },
      },
    },
  }

  it('returns all schemas from OpenAPI document', () => {
    const result = getSchemas(EXAMPLE_DOCUMENT)
    expect(result).toEqual(EXAMPLE_DOCUMENT.components?.schemas)
    expect(Object.keys(result)).toHaveLength(2)
    expect(result).toHaveProperty('User')
    expect(result).toHaveProperty('Error')
  })

  it('returns empty object when no schemas exist', () => {
    const WITHOUT_SCHEMAS: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {},
    }
    const result = getSchemas(WITHOUT_SCHEMAS)
    expect(result).toEqual({})
  })

  it('returns empty object when content is undefined', () => {
    const result = getSchemas(undefined)
    expect(result).toEqual({})
  })

  it('filters schemas based on provided filter function', () => {
    const filter = (schema: OpenAPIV3_1.SchemaObject) => schema.properties?.id !== undefined

    const result = getSchemas(EXAMPLE_DOCUMENT, { filter })

    expect(Object.keys(result)).toHaveLength(1)
    expect(result).toHaveProperty('User')
    expect(result).not.toHaveProperty('Error')
  })

  it('handles empty components object', () => {
    const EMPTY_COMPONENTS: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      components: {},
    }
    const result = getSchemas(EMPTY_COMPONENTS)
    expect(result).toEqual({})
  })
})
