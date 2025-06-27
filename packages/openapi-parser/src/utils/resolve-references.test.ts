import path from 'node:path'
/**
 * This file has some simple tests to cover the basics of the resolveReferences function.
 * Doesn't cover all edge cases, doesn't have big files, but if this works you're almost there.
 */
import SwaggerParser from '@apidevtools/swagger-parser'
import { describe, expect, it } from 'vitest'

import { readFiles } from '@/plugins/read-files/read-files'
import type { AnyObject } from '@/types/index'
import { load } from './load/load'
import { resolveReferences } from './resolve-references'

const EXAMPLE_FILE = path.join(new URL(import.meta.url).pathname, '../../../tests/filesystem/api/openapi.yaml')

describe('resolveReferences', () => {
  it('resolves a single reference', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {},
      paths: {
        '/foobar': {
          post: {
            requestBody: {
              $ref: '#/components/requestBodies/Foobar',
            },
          },
        },
      },
      components: {
        requestBodies: {
          Foobar: {
            content: {},
          },
        },
      },
    }

    // Run the specification through our new parser
    const { schema } = resolveReferences(specification)

    // Assertion
    expect(schema.paths['/foobar'].post.requestBody.content).not.toBe(undefined)
  })

  it("returns an error when a reference can't be found", async () => {
    const specification = {
      openapi: '3.1.0',
      info: {},
      paths: {
        '/foobar': {
          post: {
            requestBody: {
              $ref: '#/components/WrongReference',
            },
          },
        },
      },
    }

    // Run the specification through our new parser
    const { valid, errors } = resolveReferences(specification)

    // Assertion
    expect(errors).not.toBe(undefined)
    expect(errors).not.toStrictEqual([])
    expect(errors[0].message).toBe("Can't resolve reference: #/components/WrongReference")
    expect(errors.length).toBe(1)
    expect(valid).toBe(false)
  })

  it("returns an error when an external reference can't be found", async () => {
    const specification = {
      openapi: '3.1.0',
      info: {},
      paths: {
        '/foobar': {
          post: {
            requestBody: {
              $ref: 'foo/bar/foobar.yaml#/components/WrongReference',
            },
          },
        },
      },
    }

    // Run the specification through our new parser
    const { valid, errors } = resolveReferences(specification)

    // Assertion
    expect(errors).not.toBe(undefined)
    expect(errors).not.toStrictEqual([])
    expect(errors[0].message).toBe("Can't resolve external reference: foo/bar/foobar.yaml")
    expect(errors.length).toBe(1)
    expect(valid).toBe(false)
  })

  it('matches output of @apidevtools/swagger-parser', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {},
      paths: {
        '/foobar': {
          post: {
            requestBody: {
              $ref: '#/components/requestBodies/Foobar',
            },
          },
        },
      },
      components: {
        requestBodies: {
          Foobar: {
            content: {},
          },
        },
      },
    }

    // Run the specification through the old parser
    const oldSchema = (await new Promise((resolve, reject) => {
      SwaggerParser.dereference(structuredClone(specification) as never, (error, result) => {
        if (error) {
          reject(error)
        }

        if (result === undefined) {
          reject("Couldn't parse the Swagger file.")

          return
        }
        resolve(result)
      })
    }).catch((error) => {
      console.error('[@apidevtools/swagger-parser]', error)
    })) as any

    // Run the specification through our new parser
    const newParser = resolveReferences(specification)

    // Assertion
    expect(newParser.schema.paths['/foobar'].post.requestBody).toMatchObject(
      oldSchema.paths['/foobar'].post.requestBody,
    )
  })

  it('resolves references inside references', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {},
      paths: {
        '/foobar': {
          post: {
            requestBody: {
              $ref: '#/components/requestBodies/Foobar',
            },
          },
        },
      },

      components: {
        requestBodies: {
          CursorRequest: {
            content: {},
          },
          Foobar: {
            // This is a reference to another reference
            $ref: '#/components/requestBodies/CursorRequest',
          },
        },
      },
    }

    // Run the specification through the old parser
    const oldSchema = (await new Promise((resolve, reject) => {
      SwaggerParser.dereference(structuredClone(specification) as never, (error, result) => {
        if (error) {
          reject(error)
        }

        if (result === undefined) {
          reject("Couldn't parse the Swagger file.")

          return
        }
        resolve(result)
      })
    }).catch((error) => {
      console.error('[@apidevtools/swagger-parser]', error)
    })) as any

    // Run the specification through our new parser
    const newParser = resolveReferences(specification)

    // Assertion
    expect(newParser.schema.paths['/foobar'].post.requestBody).toMatchObject(
      oldSchema.paths['/foobar'].post.requestBody,
    )
  })

  it('resolves references in arrays', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {},
      paths: {
        '/foobar': {
          post: {
            requestBody: {
              $ref: '#/components/requestBodies/Foobar',
            },
          },
        },
      },

      components: {
        schemas: {
          Barfoo: {
            type: 'string',
            example: 'barfoo',
          },
        },
        requestBodies: {
          Foobar: {
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      $ref: '#/components/schemas/Barfoo',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    }

    // Run the specification through our new parser
    const { schema } = resolveReferences(specification)

    // Assertion
    expect(schema.paths['/foobar'].post.requestBody.content['application/json'].schema.oneOf[0]).toMatchObject({
      type: 'string',
      example: 'barfoo',
    })
  })

  it('merges original properties and referenced content', async () => {
    const specification = {
      openapi: '3.1.0',
      info: {},
      paths: {
        '/foobar': {
          post: {
            requestBody: {
              $ref: '#/components/requestBodies/Foobar',
            },
          },
        },
      },
      components: {
        schemas: {
          Barfoo: {
            type: 'string',
            example: 'barfoo',
          },
        },
        requestBodies: {
          Foobar: {
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      description: 'This is a barfoo',
                      $ref: '#/components/schemas/Barfoo',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    }

    // Run the specification through our new parser
    const { schema } = resolveReferences(specification)

    // Assertion
    expect(schema.paths['/foobar'].post.requestBody.content['application/json'].schema.oneOf[0]).toMatchObject({
      type: 'string',
      example: 'barfoo',
      description: 'This is a barfoo',
    })
  })

  it('references inside references still keep the reference to the original JS object', async () => {
    const specification = {
      swagger: '2.0',
      info: {
        title: 'Branded Fares Upsell',
        version: '1.0.1',
      },
      paths: {
        '/foobar': {
          post: {
            responses: {
              '200': {
                $ref: '#/responses/returnUpsell',
              },
            },
          },
        },
      },
      responses: {
        returnUpsell: {
          schema: {
            type: 'object',
            properties: {
              dictionaries: {
                $ref: '#/definitions/LocationEntry',
              },
            },
          },
        },
      },
      definitions: {
        Dictionaries: {
          type: 'object',
          properties: {
            locations: {
              $ref: '#/definitions/LocationEntry',
            },
          },
        },
        LocationEntry: {
          additionalProperties: {
            $ref: '#/definitions/LocationValue',
          },
        },
        LocationValue: {
          properties: {
            cityCode: {
              description: 'City code associated to the airport',
              example: 'PAR',
              type: 'string',
            },
          },
        },
      },
    }

    // Run the specification through our new parser
    const { schema } = resolveReferences(specification)

    // Assertion
    expect(schema.swagger).toBe('2.0')
    expect(
      schema.paths['/foobar'].post.responses[200].schema.properties.dictionaries.additionalProperties,
    ).toMatchObject({
      properties: {
        cityCode: {
          description: 'City code associated to the airport',
          example: 'PAR',
          type: 'string',
        },
      },
    })
  })

  it('resolves a simple circular reference', async () => {
    const partialSpecification: AnyObject = {
      foo: {
        bar: {
          $ref: '#/foo',
        },
      },
    }

    const { schema } = resolveReferences(partialSpecification)

    // Circular references can't be JSON.stringify'd (easily)
    expect(() => JSON.stringify(schema, null, 2)).toThrow()

    // Sky is the limit
    expect(schema.foo.bar.bar.bar.bar.bar.bar.bar.bar).toBeTypeOf('object')
  })

  it('resolves a more advanced circular reference', async () => {
    const partialSpecification: AnyObject = {
      type: 'object',
      properties: {
        element: { $ref: '#/schemas/element' },
        foobar: { $ref: '#/schemas/foobar' },
      },
      schemas: {
        element: {
          type: 'object',
          properties: {
            element: { $ref: '#/schemas/element' },
          },
        },
        foobar: {
          type: 'object',
          properties: {
            foobar: { $ref: '#/schemas/foobar' },
          },
        },
      },
    }

    // Typecasting: We're misusing the function and pass a partial specification only.
    const { schema } = resolveReferences(partialSpecification) as any

    // Circular references can't be JSON.stringify'd (easily)
    expect(() => JSON.stringify(schema, null, 2)).toThrow()

    // Sky is the liit
    expect(schema.schemas.element.properties.element.properties.element.properties.element).toBeTypeOf('object')
  })

  it('resolves an OpenAPI-like circular reference', async () => {
    const specification = {
      type: 'object',
      properties: {
        element: { $ref: '#/schemas/element' },
      },
      schemas: {
        element: {
          type: 'object',
          properties: {
            element: { $ref: '#/schemas/element' },
          },
        },
      },
    }

    const { schema } = resolveReferences(specification)

    // Original specification should not be mutated
    expect(specification.properties.element.$ref).toBeTypeOf('string')

    // Circular dependency should be resolved
    expect(schema.properties.element.type).toBe('object')
    expect(schema.properties.element.properties.element.type).toBe('object')
    expect(schema.properties.element.properties.element.properties.element.type).toBe('object')

    // Circular references can't be JSON.stringify'd (easily)
    expect(() => JSON.stringify(schema, null, 2)).toThrow()
  })

  it('composes two files', async () => {
    const filesystem = [
      {
        dir: '/Foobar',
        isEntrypoint: true,
        references: ['other/folder/foobar.json'],
        filename: 'openapi.json',
        specification: {
          openapi: '3.1.0',
          info: {},
          paths: {
            '/foobar': {
              post: {
                requestBody: {
                  $ref: 'other/folder/foobar.json',
                },
              },
            },
          },
        },
      },
      {
        dir: '/Foobar/other/folder',
        isEntrypoint: false,
        references: [],
        filename: 'other/folder/foobar.json',
        specification: {
          content: {
            'application/json': {
              schema: {
                type: 'string',
                example: 'foobar',
              },
            },
          },
        },
      },
    ]

    const { schema } = resolveReferences(filesystem)

    expect(schema.paths['/foobar'].post.requestBody.content['application/json'].schema.example).toBe('foobar')
  })

  it('resolves reference to a part of an external file', async () => {
    const filesystem = [
      {
        dir: '/Foobar',
        isEntrypoint: true,
        references: ['other/folder/foobar.json'],
        filename: 'openapi.json',
        specification: {
          openapi: '3.1.0',
          info: {},
          paths: {
            '/foobar': {
              post: {
                requestBody: {
                  $ref: 'other/folder/foobar.json#/components/requestBodies/Foobar',
                },
              },
            },
          },
        },
      },
      {
        dir: '/Foobar/other/folder',
        isEntrypoint: false,
        references: [],
        filename: 'other/folder/foobar.json',
        specification: {
          components: {
            requestBodies: {
              Foobar: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'string',
                      example: 'foobar',
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]

    const { schema } = resolveReferences(filesystem)
    expect(schema.paths['/foobar'].post.requestBody.content['application/json'].schema.example).toBe('foobar')
  })

  it('resolves references in external files', async () => {
    const filesystem = [
      {
        dir: '/Foobar',
        isEntrypoint: true,
        references: ['other/folder/foobar.json'],
        filename: 'openapi.json',
        specification: {
          openapi: '3.1.0',
          info: {},
          paths: {
            '/foobar': {
              post: {
                requestBody: {
                  $ref: 'other/folder/foobar.json#/components/requestBodies/Foobar',
                },
              },
            },
          },
        },
      },
      {
        dir: '/Foobar/other/folder',
        isEntrypoint: false,
        references: ['barfoo.json'],
        filename: 'other/folder/foobar.json',
        specification: {
          components: {
            requestBodies: {
              Foobar: {
                $ref: 'barfoo.json',
              },
            },
          },
        },
      },
      {
        dir: '/Foobar/other/folder',
        isEntrypoint: false,
        references: [],
        filename: 'barfoo.json',
        specification: {
          content: {
            'application/json': {
              schema: {
                type: 'string',
                example: 'foobar',
              },
            },
          },
        },
      },
    ]

    const { schema } = resolveReferences(filesystem)
    expect(schema.paths['/foobar'].post.requestBody.content['application/json'].schema.example).toBe('foobar')
  })

  it('resolves from filesystem', async () => {
    const { filesystem } = await load(EXAMPLE_FILE, {
      plugins: [readFiles()],
    })

    const { schema } = resolveReferences(filesystem)

    // Resolve the *path* from the given file
    expect(schema.components.schemas.Upload.allOf[0].title).toBe('Coordinates')
  })

  it('resolves reference to self by filename', async () => {
    const filesystem = [
      {
        dir: '/Foobar',
        isEntrypoint: true,
        references: [],
        filename: 'openapi.json',
        specification: {
          openapi: '3.1.0',
          info: {},
          paths: {
            '/foobar': {
              post: {
                requestBody: {
                  $ref: 'openapi.json#/components/requestBodies/Foobar',
                },
              },
            },
          },
          components: {
            requestBodies: {
              Foobar: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'string',
                      example: 'foobar',
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]

    const { schema } = resolveReferences(filesystem)
    expect(schema.paths['/foobar'].post.requestBody.content['application/json'].schema.example).toBe('foobar')
  })
})
