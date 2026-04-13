import { describe, expect, it } from 'vitest'

import { validatePathParameters } from './validate-path-parameters'

describe('validatePathParameters', () => {
  it('ignores non-spec uppercase operation keys', () => {
    const errors = validatePathParameters({
      openapi: '3.1.0',
      info: {
        title: 'Test',
        version: '1.0.0',
      },
      paths: {
        '/pets/{petId}': {
          GET: {
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
        },
      },
    })

    expect(errors).toEqual([])
  })

  it('returns an error for unused operation-level path parameters', () => {
    const errors = validatePathParameters({
      openapi: '3.1.0',
      info: {
        title: 'Test',
        version: '1.0.0',
      },
      paths: {
        '/pets/{petId}': {
          get: {
            parameters: [
              { name: 'petId', in: 'path', required: true, schema: { type: 'string' } },
              { name: 'testId', in: 'path', required: true, schema: { type: 'string' } },
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

    expect(errors).toContainEqual({
      path: ['paths', '/pets/{petId}', 'get', 'parameters', '1', 'name'],
      message: 'Path parameter "testId" must have the corresponding {testId} segment in the "/pets/{petId}" path',
    })
  })

  it('returns an error when a template parameter is missing from the effective operation parameters', () => {
    const errors = validatePathParameters({
      openapi: '3.1.0',
      info: {
        title: 'Test',
        version: '1.0.0',
      },
      paths: {
        '/pets/{petId}/{testId}': {
          get: {
            parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
        },
      },
    })

    expect(errors).toContainEqual({
      path: ['paths', '/pets/{petId}/{testId}', 'get'],
      message:
        'Declared path parameter "testId" needs to be defined as a path parameter at either the path or operation level',
    })
  })

  it('accepts path-level path parameters that satisfy the operation', () => {
    const errors = validatePathParameters({
      openapi: '3.1.0',
      info: {
        title: 'Test',
        version: '1.0.0',
      },
      paths: {
        '/pets/{petId}': {
          parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
          get: {
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
        },
      },
    })

    expect(errors).toEqual([])
  })

  it('accepts template parameters with a trailing plus when the registered path parameter omits the plus', () => {
    const errors = validatePathParameters({
      openapi: '3.1.0',
      info: {
        title: 'Test',
        version: '1.0.0',
      },
      paths: {
        '/pets/{petId+}': {
          get: {
            parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
        },
      },
    })

    expect(errors).toEqual([])
  })
})
