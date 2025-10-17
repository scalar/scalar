import type { OpenAPIV3_2 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { dereferenceSync } from './dereference'

describe('dereferenceSync', () => {
  it('dereferences an OpenAPI 3.2.0 file', () => {
    const result = dereferenceSync(`{
      "openapi": "3.2.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.errors).toStrictEqual([])
    expect(result.schema.info.title).toBe('Hello World')
  })

  it('dereferences an OpenAPI 3.1.0 file', () => {
    const result = dereferenceSync(`{
      "openapi": "3.1.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.errors).toStrictEqual([])
    expect(result.schema.info.title).toBe('Hello World')
  })

  it('dereferences an OpenAPI 3.0.0 file', () => {
    const result = dereferenceSync(`{
      "openapi": "3.0.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.errors).toStrictEqual([])
    expect(result.schema.info.title).toBe('Hello World')
  })

  it('dereferences an Swagger 2.0 file', () => {
    const result = dereferenceSync(`{
      "swagger": "2.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.errors).toStrictEqual([])
    expect(result.schema.info.title).toBe('Hello World')
  })

  it('returns version 3.1', () => {
    const result = dereferenceSync(`{
      "openapi": "3.1.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })

  it('returns version 3.0', () => {
    const result = dereferenceSync(`{
      "openapi": "3.0.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.0')
  })

  it('returns version 2.0', () => {
    const result = dereferenceSync(`{
      "swagger": "2.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('2.0')
  })

  it(`doesn't return version 4.0`, () => {
    const result = dereferenceSync(`{
      "openapi": "4.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.version).toBe(undefined)
  })

  it('dereferences a simple reference', () => {
    const openapi = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                // TODO: This is valid in @apidevtools/swagger, but not with our implementation
                description: 'foobar',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Test',
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Test: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
          },
        },
      },
    }

    const result = dereferenceSync(openapi)

    expect(result.errors).toStrictEqual([])

    // Original
    expect(result.specification.paths['/test'].get.responses['200'].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/Test',
    })

    // Resolved references
    expect(result.schema.paths['/test'].get.responses['200'].content['application/json'].schema).toEqual({
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
    })
  })

  it('throws an error', () => {
    expect(() => {
      dereferenceSync(
        {
          openapi: '3.1.0',
          info: {},
          paths: {
            '/foobar': {
              post: {
                requestBody: {
                  $ref: '#/components/requestBodies/DoesNotExist',
                },
              },
            },
          },
        },
        {
          throwOnError: true,
        },
      )
    }).toThrowError("Can't resolve reference: #/components/requestBodies/DoesNotExist")
  })

  it('resolves external file references', () => {
    const filesystem = [
      {
        isEntrypoint: true,
        specification: {
          openapi: '3.1.0',
          info: {
            title: 'File Reference',
            version: '1.0.0',
          },
          paths: {},
          components: {
            schemas: {
              ExternalSchema: {
                $ref: 'valid.yaml#/components/schemas/ExampleSchema',
              },
            },
          },
        },
        filename: 'file-reference.yaml',
        dir: './',
        references: ['valid.yaml'],
      },
      {
        isEntrypoint: false,
        specification: {
          openapi: '3.1.0',
          info: {
            title: 'Hello World',
            version: '1.0.0',
          },
          paths: {},
          components: {
            schemas: {
              ExampleSchema: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'Unique identifier for the example',
                  },
                  name: {
                    type: 'string',
                    description: 'Name of the example',
                  },
                  description: {
                    type: 'string',
                    description: 'Detailed description of the example',
                  },
                },
                required: ['id', 'name'],
              },
            },
          },
        },
        filename: 'valid.yaml',
        dir: './',
        references: [],
      },
    ]

    const result = dereferenceSync(filesystem)

    expect(result.errors).toStrictEqual([])

    // Check if the external reference was resolved
    expect(result.schema.components.schemas.ExternalSchema).toEqual({
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          description: 'Unique identifier for the example',
        },
        name: {
          type: 'string',
          description: 'Name of the example',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the example',
        },
      },
      required: ['id', 'name'],
    })
  })

  it('calls ondereferenceSync when resolving references', () => {
    const openapi = {
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          get: {
            responses: {
              '200': {
                description: 'foobar',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Test',
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Test: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
          },
        },
      },
    }

    const dereferenceSyncdSchemas: Array<{ schema: any; ref: string }> = []

    const result = dereferenceSync(openapi, {
      onDereference: ({ schema, ref }) => {
        expect(schema).toEqual({
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
          },
        })

        expect(ref).toEqual('#/components/schemas/Test')

        dereferenceSyncdSchemas.push({ schema, ref })
      },
    })

    expect(result.errors).toStrictEqual([])
    expect(dereferenceSyncdSchemas).toHaveLength(1)
  })

  it('dereferences operations with query operations', () => {
    const openapi = {
      openapi: '3.2.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          query: {
            responses: {
              '200': {
                description: 'foobar',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Test',
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Test: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
          },
        },
      },
    }

    const result = dereferenceSync(openapi)

    expect(result.errors).toStrictEqual([])

    // Original
    expect(
      (result.specification as OpenAPIV3_2.Document).paths['/test'].query.responses['200'].content['application/json']
        .schema,
    ).toEqual({
      $ref: '#/components/schemas/Test',
    })
  })

  it('dereferences operations with additional operations', () => {
    const openapi = {
      openapi: '3.2.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/test': {
          additionalOperations: {
            makeUnicorns: {
              responses: {
                '200': {
                  description: 'foobar',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/Test',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Test: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
          },
        },
      },
    }

    const result = dereferenceSync(openapi)

    expect(result.errors).toStrictEqual([])

    // Original
    expect(
      (result.specification as OpenAPIV3_2.Document).paths['/test'].additionalOperations?.makeUnicorns.responses['200']
        .content['application/json'].schema,
    ).toEqual({
      $ref: '#/components/schemas/Test',
    })
  })
})
