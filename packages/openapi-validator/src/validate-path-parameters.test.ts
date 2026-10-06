import { describe, expect, it } from 'vitest'

import { validatePathParameters } from './validate-path-parameters'

describe('validatePathParameters', () => {
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

  it('inspects path items that are not plain objects', () => {
    // A hand-constructed document can carry class instances. Skipping those
    // would silently leave a whole path item unvalidated.
    class PathItem {
      get = {
        parameters: [{ name: 'testId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      }
    }

    const errors = validatePathParameters({ paths: { '/pets': new PathItem() } })

    expect(errors).toContainEqual(
      expect.objectContaining({
        message: 'Path parameter "testId" must have the corresponding {testId} segment in the "/pets" path',
      }),
    )
  })

  const methods = [
    { method: 'query', path: ['query'] },
    { method: 'COPY', path: ['additionalOperations', 'COPY'] },
    { method: 'copy', path: ['additionalOperations', 'copy'] },
    { method: 'pAtCh', path: ['additionalOperations', 'pAtCh'] },
  ]
  const withOperation = (method: string, operation: Record<string, unknown>): Record<string, unknown> =>
    method === 'query' ? { query: operation } : { additionalOperations: { [method]: operation } }

  it.each(methods)('reports a missing template parameter for $method', ({ method, path }) => {
    const errors = validatePathParameters({
      openapi: '3.2.1',
      paths: { '/pets/{petId}': withOperation(method, { responses: { '200': { description: 'OK' } } }) },
    })

    expect(errors).toStrictEqual([
      {
        path: ['paths', '/pets/{petId}', ...path],
        message:
          'Declared path parameter "petId" needs to be defined as a path parameter at either the path or operation level',
      },
    ])
  })

  it.each(methods)('reports a mismatched operation-level parameter for $method', ({ method, path }) => {
    const errors = validatePathParameters({
      openapi: '3.2.1',
      paths: {
        '/pets': withOperation(method, {
          parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
        }),
      },
    })

    expect(errors).toStrictEqual([
      {
        path: ['paths', '/pets', ...path, 'parameters', '0', 'name'],
        message: 'Path parameter "petId" must have the corresponding {petId} segment in the "/pets" path',
      },
    ])
  })

  it.each(methods)('reports a mismatched path-level parameter with only $method', ({ method }) => {
    const errors = validatePathParameters({
      openapi: '3.2.1',
      paths: {
        '/pets': {
          parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
          ...withOperation(method, {}),
        },
      },
    })

    expect(errors).toStrictEqual([
      {
        path: ['paths', '/pets', 'parameters', '0', 'name'],
        message: 'Path parameter "petId" must have the corresponding {petId} segment in the "/pets" path',
      },
    ])
  })

  it.each(methods)('inherits path-level parameters for $method even with an empty operation list', ({ method }) => {
    const errors = validatePathParameters({
      openapi: '3.2.1',
      paths: {
        '/pets/{petId}': {
          parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
          ...withOperation(method, { parameters: [] }),
        },
      },
    })

    expect(errors).toStrictEqual([])
  })

  it.each(methods)('accepts operation-level parameters for $method', ({ method }) => {
    const errors = validatePathParameters({
      openapi: '3.2.1',
      paths: {
        '/pets/{petId}': withOperation(method, {
          parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string' } }],
        }),
      },
    })

    expect(errors).toStrictEqual([])
  })

  it('checks each method independently on a mixed path item', () => {
    const errors = validatePathParameters({
      openapi: '3.2.1',
      paths: {
        '/pets/{petId}': {
          get: { parameters: [{ name: 'petId', in: 'path' }] },
          query: {},
          additionalOperations: { COPY: {}, copy: {} },
        },
      },
    })

    expect(errors).toStrictEqual([
      {
        path: ['paths', '/pets/{petId}', 'query'],
        message:
          'Declared path parameter "petId" needs to be defined as a path parameter at either the path or operation level',
      },
      {
        path: ['paths', '/pets/{petId}', 'additionalOperations', 'COPY'],
        message:
          'Declared path parameter "petId" needs to be defined as a path parameter at either the path or operation level',
      },
      {
        path: ['paths', '/pets/{petId}', 'additionalOperations', 'copy'],
        message:
          'Declared path parameter "petId" needs to be defined as a path parameter at either the path or operation level',
      },
    ])
  })

  it.each([
    {},
    { additionalOperations: {} },
    { additionalOperations: null },
    { additionalOperations: [] },
    { additionalOperations: { COPY: null } },
  ])('preserves empty path behavior for %j', (pathItem) => {
    expect(validatePathParameters({ openapi: '3.2.1', paths: { '/pets/{petId}': pathItem } })).toStrictEqual([])
  })
})
