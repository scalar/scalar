import { describe, expect, it } from 'vitest'

import { validate } from './validate'
import { validateOperationIds } from './validate-operation-ids'

const operation = (operationId: string): Record<string, unknown> => ({
  operationId,
  responses: { '200': { description: 'OK' } },
})
const duplicate = {
  path: '/paths/~1second/post/operationId',
  message: 'Duplicate operationId "same"; first declared at /paths/~1first/get/operationId.',
}

describe('validate-operation-ids', () => {
  it.each(['2.0', '3.0', '3.1', '3.2'] as const)('rejects duplicate IDs in %s and honors throwOnError', (version) => {
    const document = {
      ...(version === '2.0' ? { swagger: '2.0' } : { openapi: `${version}.0` }),
      info: { title: 'API', version: '1' },
      paths: { '/first': { get: operation('same') }, '/second': { post: operation('same') } },
    }
    const result = validate(document)
    expect(result.valid).toBe(false)
    expect(result.errors).toStrictEqual([duplicate])
    expect(() => validate(document, { throwOnError: true })).toThrow(duplicate.message)
  })

  it('accepts distinct, case-sensitive IDs and absent IDs', () => {
    expect(
      validateOperationIds(
        {
          paths: {
            '/first': { get: operation('read'), post: operation('Read') },
            '/second': { get: {}, post: {} },
          },
        },
        '3.1',
      ),
    ).toStrictEqual([])
  })

  it('reports every later duplicate and escapes JSON Pointer segments', () => {
    expect(
      validateOperationIds(
        {
          paths: {
            '/a~b': { get: operation(''), post: operation('') },
            '/second': { get: operation('') },
          },
        },
        '3.1',
      ),
    ).toStrictEqual([
      {
        path: '/paths/~1a~0b/post/operationId',
        message: 'Duplicate operationId ""; first declared at /paths/~1a~0b/get/operationId.',
      },
      {
        path: '/paths/~1second/get/operationId',
        message: 'Duplicate operationId ""; first declared at /paths/~1a~0b/get/operationId.',
      },
    ])
  })

  it('checks callbacks and webhooks without treating their names as extensions', () => {
    expect(
      validateOperationIds(
        {
          paths: {
            '/first': {
              get: {
                ...operation('same'),
                callbacks: {
                  'x-callback': { '{$request.query.url}': { post: operation('same') } },
                },
              },
            },
          },
          webhooks: { 'x-event': { post: operation('same') } },
        },
        '3.1',
      ),
    ).toStrictEqual([
      {
        path: '/paths/~1first/get/callbacks/x-callback/{$request.query.url}/post/operationId',
        message: duplicate.message,
      },
      { path: '/webhooks/x-event/post/operationId', message: duplicate.message },
    ])
  })

  it('checks the query method and additional operations in 3.2', () => {
    expect(
      validateOperationIds(
        {
          paths: {
            '/first': {
              get: operation('same'),
              query: operation('same'),
              additionalOperations: { COPY: operation('same') },
            },
          },
        },
        '3.2',
      ),
    ).toStrictEqual([
      { path: '/paths/~1first/query/operationId', message: duplicate.message },
      { path: '/paths/~1first/additionalOperations/COPY/operationId', message: duplicate.message },
    ])
  })

  it.each(['2.0', '3.0', '3.1'] as const)('ignores newer operation locations in %s', (version) => {
    const document = {
      paths: {
        '/first': {
          get: operation('same'),
          query: operation('same'),
          additionalOperations: { COPY: operation('same') },
        },
      },
    }
    expect(validateOperationIds(document, version)).toStrictEqual([])
  })

  it('follows local path item and callback references without counting unused definitions', () => {
    const document = {
      paths: { '/first': { get: operation('same') }, '/second': { $ref: '#/components/pathItems/Shared' } },
      components: {
        pathItems: {
          Shared: { post: { ...operation('same'), callbacks: { event: { $ref: '#/components/callbacks/Event' } } } },
          Unused: { get: operation('same') },
        },
        callbacks: { Event: { '{$request.query.url}': { get: operation('same') } } },
      },
    }
    const original = structuredClone(document)
    expect(validateOperationIds(document, '3.1')).toStrictEqual([
      duplicate,
      { path: '/paths/~1second/post/callbacks/event/{$request.query.url}/get/operationId', message: duplicate.message },
    ])
    expect(document).toStrictEqual(original)
  })

  it('decodes reference fragments once before unescaping pointer segments', () => {
    expect(
      validateOperationIds(
        {
          paths: {
            '/first': { get: operation('same') },
            '/second': { $ref: '#/%63omponents/pathItems/Shared%252Fname' },
          },
          components: { pathItems: { 'Shared%2Fname': { post: operation('same') } } },
        },
        '3.1',
      ),
    ).toStrictEqual([duplicate])
  })

  it.each(['other.yaml#/item', '#/missing', '#/%ZZ', '#anchor', '#/components/pathItems/Cycle'])(
    'leaves unresolved references to the resolver: %s',
    ($ref) => {
      expect(
        validateOperationIds(
          {
            paths: { '/first': { get: operation('same') }, '/second': { $ref } },
            components: { pathItems: { Cycle: { $ref: '#/components/pathItems/Cycle' } } },
          },
          '3.1',
        ),
      ).toStrictEqual([])
    },
  )

  it('terminates recursive callbacks and still checks other paths', () => {
    const document = {
      paths: {
        '/first': {
          get: { ...operation('same'), callbacks: { again: { '{$request.query.url}': { $ref: '#/paths/~1first' } } } },
        },
        '/second': { post: operation('same') },
      },
    }
    expect(validateOperationIds(document, '3.1')).toStrictEqual([duplicate])
  })

  it('ignores examples, extensions, links and inactive reusable operations', () => {
    expect(
      validateOperationIds(
        {
          paths: {
            '/first': {
              get: {
                ...operation('same'),
                'x-data': { get: operation('same') },
                responses: {
                  '200': {
                    description: 'OK',
                    links: { target: { operationId: 'same' } },
                    content: { 'application/json': { example: { get: operation('same') } } },
                  },
                },
              },
            },
            'x-data': { get: operation('same') },
          },
          components: {
            pathItems: { Unused: { get: operation('same') } },
            callbacks: { Unused: { event: { get: operation('same') } } },
          },
        },
        '3.1',
      ),
    ).toStrictEqual([])
  })
})
