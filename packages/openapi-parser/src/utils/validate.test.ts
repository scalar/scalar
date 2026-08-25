import { describe, expect, it } from 'vitest'

import type { AnyObject } from '@/types/index'

import { validate } from './validate'

describe('validate', () => {
  it('fails on invalid schema', async () => {
    const result = await validate('')

    expect(result.valid).toBe(false)
    expect(result.errors).toMatchObject([
      {
        message: "Can't find JSON, YAML or filename in data.",
      },
    ])
  })

  it('returns errors for an invalid schema', async () => {
    const result = await validate(
      `{
        "openapi": "3.1.0",
        "paths": {}
      }`,
    )

    expect(result.valid).toBe(false)

    expect(result.errors).toBeTypeOf('object')
    expect(Array.isArray(result.errors)).toBe(true)
    expect(result.errors.length).toBe(1)
    expect(result.errors[0]).toMatchObject({
      message: "must have required property 'info'",
    })
  })

  it('returns errors for an invalid specification', async () => {
    const result = await validate('pineapples')

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toBe("Can't find JSON, YAML or filename in data.")
  })

  it('works with YAML', async () => {
    const result = await validate(`openapi: 3.1.0
info:
  title: Hello World
  version: 1.0.0
paths: {}
`)

    expect((result.schema as AnyObject).info.title).toBe('Hello World')
  })

  it('works with OpenAPI 3.2.0', async () => {
    const result = await validate(`{
      "openapi": "3.2.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.valid).toBe(true)
    expect((result.schema as AnyObject).info.title).toBe('Hello World')
  })

  it(`doesn't work with OpenAPI 4.0.0`, async () => {
    const result = await validate(`{
      "openapi": "4.0.0",
      "info": {
          "title": "Hello World",
          "version": "1.0.0"
      },
      "paths": {}
    }`)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain("Can't find supported Swagger/OpenAPI version in the provided document")
  })

  it('throws an error', async () => {
    await expect(() =>
      validate(undefined, {
        throwOnError: true,
      }),
    ).rejects.toThrowError("Can't find JSON, YAML or filename in data")
  })

  it('returns an error for unused path parameters in OpenAPI 3.1 documents', async () => {
    const result = await validate({
      openapi: '3.1.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {
        '/pets/{petId}': {
          get: {
            parameters: [
              {
                name: 'petId',
                in: 'path',
                required: true,
                schema: {
                  type: 'string',
                },
              },
              {
                name: 'testId',
                in: 'path',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
        },
      },
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: 'Path parameter "testId" must have the corresponding {testId} segment in the "/pets/{petId}" path',
      }),
    )
  })

  it('reports the missing `description` instead of the misleading `$ref` for a response', async () => {
    // Regression test for https://github.com/scalar/scalar/issues/4838
    // A response value validates against `oneOf: [Response, Reference]`. When it
    // is missing the required `description`, both branches fail. The error should
    // point at the missing `description`, not the `$ref` of the Reference branch
    // (nor the opaque "oneOf must match exactly one schema in oneOf").
    const result = await validate({
      openapi: '3.0.0',
      info: { title: 'DAPI', version: '1.0' },
      paths: {
        '/user_activity': {
          get: {
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { foo: { type: 'string' } } },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: "must have required property 'description'",
      }),
    )
    expect(result.errors).not.toContainEqual(
      expect.objectContaining({
        message: "must have required property '$ref'",
      }),
    )
  })

  it('reports reference-resolution errors alongside path-parameter errors', async () => {
    // A path-parameter semantic error must not stop reference resolution: both
    // the semantic error and the unresolvable `$ref` should be reported.
    const result = await validate({
      openapi: '3.0.0',
      info: { title: 'Hello World', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            parameters: [
              {
                name: 'petId',
                in: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
            responses: {
              200: {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Missing' },
                  },
                },
              },
            },
          },
        },
      },
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: 'Path parameter "petId" must have the corresponding {petId} segment in the "/pets" path',
      }),
    )
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('#/components/schemas/Missing'),
      }),
    )
  })

  it('stays lenient about a missing info.version by defaulting it', async () => {
    // The standalone validator is strict, but the parser defaults a missing
    // info.version so documents that omit it still validate.
    const document: AnyObject = { openapi: '3.1.0', info: { title: 'No version' }, paths: {} }
    const result = await validate(document)

    expect(result.valid).toBe(true)
    expect(document.info.version).toBe('0.1.0')
  })
})
