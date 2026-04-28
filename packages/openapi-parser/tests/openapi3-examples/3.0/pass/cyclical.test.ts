import { getListOfReferences } from '@/utils/get-list-of-references'
import { validate } from '@/utils/validate'
import { describe, expect, it } from 'vitest'
import type { AnyObject } from '@/types/index'

describe('cyclical', () => {
  it('resolves circular references', async () => {
    const specification = {
      openapi: '3.0.0',
      info: {
        title: 'API',
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {
          top: {
            type: 'object',
            properties: {
              cat: {
                $ref: '#/components/schemas/category',
              },
            },
          },
          category: {
            type: 'object',
            properties: {
              subcategories: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/category',
                },
              },
            },
          },
        },
      },
    }

    const result = await validate(specification)
    const schema = result.schema as AnyObject

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
    expect(schema.components.schemas.top.type).toEqual('object')
    expect(schema.components.schemas.top.properties.cat.type).toEqual('object')
    const category = schema.components.schemas.top.properties.cat.properties
    expect(category.subcategories.items.properties.subcategories.type).toEqual('array')
  })

  it.todo('resolves circular dependencies in referenced files', async () => {
    const baseFile = {
      openapi: '3.0.0',
      info: {
        title: 'API',
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {
          top: {
            $ref: '../partial/cycledef.yaml#/components/schemas/top',
          },
        },
      },
    }

    const referencedFile = {
      components: {
        schemas: {
          top: {
            type: 'object',
            properties: {
              cat: {
                $ref: '#/components/schemas/category',
              },
            },
          },
          category: {
            type: 'object',
            properties: {
              subcategories: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/category',
                },
              },
            },
          },
        },
      },
    }

    const result = await validate([
      {
        isEntrypoint: true,
        specification: baseFile,
        filename: 'openapi.json',
        dir: './',
        references: getListOfReferences(baseFile),
      },
      {
        isEntrypoint: false,
        specification: referencedFile,
        filename: '../partial/cycledef.yaml',
        dir: './',
        references: getListOfReferences(baseFile),
      },
    ])
    const schema = result.schema as AnyObject

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
    expect(schema.components.schemas.top.type).toEqual('object')
    expect(schema.components.schemas.top.properties.cat.type).toEqual('object')
  })
})
