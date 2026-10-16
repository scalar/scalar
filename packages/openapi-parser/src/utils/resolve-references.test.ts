/**
 * This file has some simple tests to cover the basics of the resolveReferences function.
 * Doesn't cover all edge cases, doesn't have big files, but if this works you're almost there.
 */
import path from 'node:path'

import SwaggerParser from '@apidevtools/swagger-parser'
import type { Document as OpenApiDocumentV3_2, InfoObject as OpenApiInfoObjectV3_2 } from '@scalar/openapi-types/3.2'
import type { AnyObject } from '@scalar/types/utils'
import { describe, expect, it } from 'vitest'

import { readFiles } from '@/plugins/read-files/read-files'

import { load } from './load/load'
import { resolveReferences } from './resolve-references'

const EXAMPLE_FILE = path.join(new URL(import.meta.url).pathname, '../../../tests/filesystem/api/openapi.yaml')

describe('resolveReferences', () => {
  it('resolves OpenAPI 2 response definitions named like extensions', () => {
    const specification = {
      swagger: '2.0',
      info: { title: 'Responses', version: '1' },
      paths: {},
      responses: { 'x-response': { $ref: '#/responses/Target' }, Target: { description: 'OK' } },
    }
    expect(resolveReferences(specification)).toStrictEqual({
      valid: true,
      errors: [],
      schema: {
        ...specification,
        responses: {
          'x-response': { description: 'OK' },
          Target: { description: 'OK' },
        },
      },
    })
  })

  it('preserves Paths and Responses extensions while resolving component names beginning with x-', () => {
    const specification = {
      openapi: '3.1.0',
      info: { title: 'Extensions', version: '1' },
      paths: {
        'x-meta': { $ref: 'literal-path.json' },
        '/': { get: { responses: { '200': { description: 'OK' }, 'x-meta': { $ref: 'literal-response.json' } } } },
      },
      components: {
        responses: { 'x-response': { $ref: '#/components/responses/Target' }, Target: { description: 'OK' } },
        schemas: { 'x-schema': { type: 'string' } },
      },
    }
    expect(resolveReferences(specification)).toStrictEqual({
      valid: true,
      errors: [],
      schema: {
        ...specification,
        components: {
          ...specification.components,
          responses: { 'x-response': { description: 'OK' }, Target: { description: 'OK' } },
        },
      },
    })
  })

  it('preserves dependentRequired property names while resolving properties named dependentRequired', () => {
    const specification = {
      openapi: '3.1.0',
      info: { title: 'Dependencies', version: '1' },
      paths: {},
      components: {
        schemas: {
          Thing: {
            type: 'object',
            properties: {
              $ref: { type: 'string' },
              other: { type: 'string' },
              dependentRequired: { $ref: '#/components/schemas/Target' },
            },
            dependentRequired: { $ref: ['other'] },
          },
          Target: { type: 'string' },
        },
      },
    }
    const result = resolveReferences(specification)
    expect(result.errors).toStrictEqual([])
    expect(result.schema).toStrictEqual({
      ...specification,
      components: {
        schemas: {
          Target: { type: 'string' },
          Thing: {
            type: 'object',
            properties: { $ref: { type: 'string' }, other: { type: 'string' }, dependentRequired: { type: 'string' } },
            dependentRequired: { $ref: ['other'] },
          },
        },
      },
    })
  })

  it('resolves schema references inside custom operations named example', () => {
    const target = { type: 'string' }
    const operation = {
      requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Target' } } } },
      responses: { '200': { description: 'OK' } },
    }
    const specification = {
      openapi: '3.2.1',
      paths: { '/': { additionalOperations: { example: operation } } },
      components: { schemas: { Target: target } },
    }
    const result = resolveReferences(specification, { throwOnError: true })
    expect(result.errors).toStrictEqual([])
    expect(result.schema).toStrictEqual({
      ...specification,
      paths: {
        '/': {
          additionalOperations: {
            example: {
              ...operation,
              requestBody: { content: { 'application/json': { schema: target } } },
            },
          },
        },
      },
    })
  })

  it('preserves OAuth scopes, discriminator mappings, Link values, and extensions', () => {
    const literal = { $ref: '#/components/schemas/Target' }
    const target = { type: 'object' }
    const mapping = { $ref: '#/components/schemas/Target' }
    const specification = {
      openapi: '3.1.0',
      'x-data': { ...literal },
      components: {
        schemas: {
          Target: target,
          Choice: { oneOf: [literal], discriminator: { propertyName: 'kind', mapping } },
          NamedProperty: { properties: { 'x-data': literal } },
        },
        links: { Next: { operationId: 'next', requestBody: { ...literal }, parameters: { filter: { ...literal } } } },
        securitySchemes: {
          OAuth: {
            type: 'oauth2',
            flows: {
              implicit: {
                authorizationUrl: 'https://example.com/auth',
                scopes: { $ref: 'Read reference resources' },
              },
            },
          },
        },
      },
    }
    const result = resolveReferences(specification, { throwOnError: true })
    expect(result.errors).toStrictEqual([])
    expect(result.schema).toStrictEqual({
      ...specification,
      components: {
        ...specification.components,
        schemas: {
          ...specification.components.schemas,
          Choice: { oneOf: [target], discriminator: { propertyName: 'kind', mapping } },
          NamedProperty: { properties: { 'x-data': target } },
        },
      },
    })
  })

  it('resolves callback references when the callback name is example', () => {
    const specification = {
      openapi: '3.1.0',
      components: {
        callbacks: {
          example: { $ref: '#/components/callbacks/Original' },
          Original: { '{$request.body#/url}': { post: { responses: { '200': { description: 'OK' } } } } },
        },
      },
    }
    const result = resolveReferences(specification, { throwOnError: true })
    expect(result.errors).toStrictEqual([])
    expect(result.schema).toStrictEqual({
      ...specification,
      components: {
        callbacks: {
          Original: specification.components.callbacks.Original,
          example: specification.components.callbacks.Original,
        },
      },
    })
  })

  it.each(['examples', 'default', 'enum', 'const'])('preserves literal $ref data in schema %s', (keyword) => {
    const literal = { $ref: '#/components/schemas/Target', nested: { $ref: 'https://example.com/data' } }
    const specification = {
      openapi: '3.1.0',
      components: {
        schemas: {
          Target: { type: 'string' },
          Example: { [keyword]: keyword === 'examples' || keyword === 'enum' ? [literal] : literal },
        },
      },
    }
    const result = resolveReferences(specification, { throwOnError: true })
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.schema).toStrictEqual(specification)
  })

  it('resolves Example Object references while preserving their literal values', () => {
    const literal = { $ref: '#/components/schemas/Target' }
    const specification = {
      openapi: '3.1.0',
      components: {
        schemas: { Target: { type: 'string' } },
        examples: { Original: { value: literal }, Copy: { $ref: '#/components/examples/Original' } },
      },
    }
    const result = resolveReferences(specification, { throwOnError: true })
    expect(result.errors).toStrictEqual([])
    expect(result.schema).toStrictEqual({
      ...specification,
      components: {
        ...specification.components,
        examples: { Original: { value: literal }, Copy: { value: literal } },
      },
    })
  })

  it.each(['properties', 'patternProperties', '$defs', 'dependentSchemas'])(
    'treats %s entries as schema names',
    (keyword) => {
      const specification = {
        [keyword]: {
          $ref: true,
          example: { properties: { $ref: false }, allOf: [{ $ref: '#/target' }] },
        },
        target: { type: 'object' },
      }
      const result = resolveReferences(specification, { throwOnError: true })
      expect(result.errors).toStrictEqual([])
      expect(result.schema).toStrictEqual({
        ...specification,
        [keyword]: { $ref: true, example: { properties: { $ref: false }, allOf: [{ type: 'object' }] } },
      })
    },
  )

  it('preserves a property named $ref and resolves references within its schema', () => {
    const specification = {
      openapi: '3.1.0',
      info: { title: 'SCIM', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          GroupMember: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              $ref: { $ref: '#/components/schemas/Uri' },
            },
          },
          Uri: { type: 'string', format: 'uri' },
        },
      },
    }

    const result = resolveReferences(specification, { throwOnError: true })

    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.schema).toStrictEqual({
      ...specification,
      components: {
        schemas: {
          ...specification.components.schemas,
          GroupMember: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              $ref: { type: 'string', format: 'uri' },
            },
          },
        },
      },
    })
    expect(specification.components.schemas.GroupMember.properties.$ref).toStrictEqual({
      $ref: '#/components/schemas/Uri',
    })
  })

  it.each([123, true, false, null, { type: 'string' }])('rejects a non-string reference value %s', ($ref) => {
    const specification = { openapi: '3.1.0', components: { schemas: { Broken: { $ref } } } }
    const result = resolveReferences(specification)

    expect(result.valid).toBe(false)
    expect(result.errors).toStrictEqual([{ code: 'INVALID_REFERENCE', message: `Can't resolve reference: ${$ref}` }])
    expect(() => resolveReferences(specification, { throwOnError: true })).toThrowError(
      `Can't resolve reference: ${$ref}`,
    )
  })

  it('resolves a media type reference', () => {
    const specification: OpenApiDocumentV3_2 = {
      openapi: '3.2.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      } satisfies OpenApiInfoObjectV3_2,
      paths: {
        '/foobar': {
          get: {
            responses: {
              '200': {
                description: 'ok',
                content: {
                  'application/json': {
                    $ref: '#/components/mediaTypes/Foobar',
                  },
                },
              },
            },
          },
        },
      },
      components: {
        mediaTypes: {
          Foobar: {
            schema: {
              type: 'string',
            },
          },
        },
      },
    }

    // Run the specification through our new parser
    const { schema } = resolveReferences(specification)

    // Assertion
    expect(schema.paths['/foobar'].get.responses[200].content['application/json'].schema).not.toBe(undefined)
  })

  it('resolves a single reference', () => {
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

  it("returns an error when a reference can't be found", () => {
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

  it("returns an error when an external reference can't be found", () => {
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

  it('resolves references in arrays', () => {
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

  it('merges original properties and referenced content', () => {
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

  it('references inside references still keep the reference to the original JS object', () => {
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

  it('resolves a simple circular reference', () => {
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
    expect((schema as AnyObject).foo.bar.bar.bar.bar.bar.bar.bar.bar).toBeTypeOf('object')
  })

  it('resolves a more advanced circular reference', () => {
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

  it('resolves an OpenAPI-like circular reference', () => {
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
    expect((schema as AnyObject).properties.element.type).toBe('object')
    expect((schema as AnyObject).properties.element.properties.element.type).toBe('object')
    expect((schema as AnyObject).properties.element.properties.element.properties.element.type).toBe('object')

    // Circular references can't be JSON.stringify'd (easily)
    expect(() => JSON.stringify(schema, null, 2)).toThrow()
  })

  it('composes two files', () => {
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

  it('resolves reference to a part of an external file', () => {
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

  it('resolves references in external files', () => {
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
    expect((schema as AnyObject).components.schemas.Upload.allOf[0].title).toBe('Coordinates')
  })

  it('resolves reference to self by filename', () => {
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
