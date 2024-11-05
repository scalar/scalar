import { describe, expect, it } from 'vitest'

import { dereference } from './dereference.js'

describe('dereference', async () => {
  it('dereferences an OpenAPI 3.1.0 file', async () => {
    const result = await dereference(`{
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

  it('dereferences an OpenAPI 3.0.0 file', async () => {
    const result = await dereference(`{
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

  it('dereferences an Swagger 2.0 file', async () => {
    const result = await dereference(`{
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

  it('returns version 3.1', async () => {
    const result = await dereference(`{
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

  it('returns version 3.0', async () => {
    const result = await dereference(`{
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

  it('returns version 2.0', async () => {
    const result = await dereference(`{
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

  it('doesn’t return version 4.0', async () => {
    const result = await dereference(`{
      "openapi": "4.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.version).toBe(undefined)
  })
})

it('dereferences a simple reference', async () => {
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

  const result = await dereference(openapi)

  expect(result.errors).toStrictEqual([])

  // Original
  expect(
    result.specification.paths['/test'].get.responses['200'].content[
      'application/json'
    ].schema,
  ).toEqual({
    $ref: '#/components/schemas/Test',
  })

  // Resolved references
  expect(
    result.schema.paths['/test'].get.responses['200'].content[
      'application/json'
    ].schema,
  ).toEqual({
    type: 'object',
    properties: {
      id: {
        type: 'string',
      },
    },
  })
})

it("doesn't attempt to dereference properties named $ref", async () => {
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
                    properties: {
                      $ref: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }

  const result = await dereference(openapi)

  expect(result.errors).toStrictEqual([])

  // Original
  expect(
    result.specification.paths['/test'].get.responses['200'].content[
      'application/json'
    ].schema.properties,
  ).toEqual({
    $ref: { type: 'string' },
  })

  // Resolved references
  expect(
    result.schema.paths['/test'].get.responses['200'].content[
      'application/json'
    ].schema.properties,
  ).toEqual({
    $ref: { type: 'string' },
  })
})

it('throws an error', async () => {
  expect(async () => {
    await dereference(
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
  }).rejects.toThrowError(
    'Can’t resolve reference: #/components/requestBodies/DoesNotExist',
  )
})
