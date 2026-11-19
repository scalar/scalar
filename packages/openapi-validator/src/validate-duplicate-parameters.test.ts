import { describe, expect, it } from 'vitest'

import { validate } from './validate'
import { validateDuplicateParameters } from './validate-duplicate-parameters'

const query = { name: 'test', in: 'query', schema: { type: 'string' } }
const duplicate = {
  path: '/paths/~1test/get/parameters/1',
  message: 'Duplicate parameter "test" in "query"; first declared at /paths/~1test/get/parameters/0.',
}

describe('validate-duplicate-parameters', () => {
  it.each(['2.0', '3.0', '3.1', '3.2'] as const)('rejects duplicate pairs in %s and honors throwOnError', (version) => {
    const parameter = version === '2.0' ? { name: 'test', in: 'query', type: 'string' } : query
    const document = {
      ...(version === '2.0' ? { swagger: '2.0' } : { openapi: `${version}.0` }),
      info: { title: 'API', version: '1' },
      paths: {
        '/test': {
          get: {
            parameters: [parameter, { ...parameter, description: 'Another' }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    }
    const result = validate(document)
    expect(result.valid).toBe(false)
    expect(result.errors).toStrictEqual([duplicate])
    expect(() => validate(document, { throwOnError: true })).toThrow(duplicate.message)
  })

  it('accepts operation overrides, different locations and case-sensitive names', () => {
    const result = validate({
      openapi: '3.1.0',
      info: { title: 'API', version: '1' },
      paths: {
        '/test': {
          parameters: [query],
          get: {
            parameters: [query, { ...query, name: 'Test' }, { ...query, in: 'header' }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
  })

  it('checks path-level lists and reports each later duplicate with escaped locations', () => {
    expect(
      validateDuplicateParameters({ paths: { '/a~b': { parameters: [query, query, query] } } }, '3.1'),
    ).toStrictEqual([
      {
        path: '/paths/~1a~0b/parameters/1',
        message: 'Duplicate parameter "test" in "query"; first declared at /paths/~1a~0b/parameters/0.',
      },
      {
        path: '/paths/~1a~0b/parameters/2',
        message: 'Duplicate parameter "test" in "query"; first declared at /paths/~1a~0b/parameters/0.',
      },
    ])
  })

  it.each(['2.0', '3.1'] as const)(
    'resolves local parameter references in %s without changing the document',
    (version) => {
      const $ref = version === '2.0' ? '#/parameters/Query' : '#/components/parameters/Query'
      const document = {
        paths: { '/test': { get: { parameters: [{ $ref }, query] } } },
        parameters: { Query: query },
        components: { parameters: { Query: query } },
      }
      const original = structuredClone(document)
      expect(validateDuplicateParameters(document, version)).toStrictEqual([duplicate])
      expect(document).toStrictEqual(original)
    },
  )

  it('resolves repeated references while ignoring Reference Object siblings', () => {
    expect(
      validateDuplicateParameters(
        {
          paths: {
            '/test': {
              get: {
                parameters: [
                  { $ref: '#/components/parameters/Query', name: 'other' },
                  { $ref: '#/components/parameters/Query', in: 'header' },
                ],
              },
            },
          },
          components: { parameters: { Query: query } },
        },
        '3.1',
      ),
    ).toStrictEqual([duplicate])
  })

  it.each(['external.yaml#/Query', '#/missing', '#/%ZZ', '#anchor', '#/components/parameters/Cycle'])(
    'skips unresolved parameter references: %s',
    ($ref) => {
      expect(
        validateDuplicateParameters(
          {
            paths: { '/test': { get: { parameters: [{ $ref }, { $ref }, query] } } },
            components: { parameters: { Cycle: { $ref: '#/components/parameters/Cycle' } } },
          },
          '3.1',
        ),
      ).toStrictEqual([])
    },
  )

  it('decodes fragment pointers once and unescapes parameter names', () => {
    expect(
      validateDuplicateParameters(
        {
          paths: { '/test': { get: { parameters: [query, { $ref: '#/%63omponents/parameters/Query~1%2525' }] } } },
          components: { parameters: { 'Query/%25': query } },
        },
        '3.1',
      ),
    ).toStrictEqual([duplicate])
  })

  it.each(['#/components/pathItems/Shared', 'external.yaml#/item'])(
    'preserves adjacent Path Item fields beside %s',
    ($ref) => {
      expect(
        validateDuplicateParameters(
          {
            paths: { '/test': { $ref, get: { parameters: [query, query] } } },
            components: { pathItems: { Shared: {} } },
          },
          '3.1',
        ),
      ).toStrictEqual([duplicate])
    },
  )

  it('checks callbacks, webhooks, reusable path items and custom operations', () => {
    const parameters = (): unknown[] => [query, query]
    const errors = validateDuplicateParameters(
      {
        paths: { '/test': { get: { callbacks: { 'x-event': { $ref: '#/components/callbacks/Event' } } } } },
        webhooks: {
          'x-hook': {
            query: { parameters: parameters() },
            additionalOperations: { COPY: { parameters: parameters() } },
          },
        },
        components: {
          callbacks: { Event: { '{$request.query.url}': { post: { parameters: parameters() } } } },
          pathItems: { Unused: { parameters: parameters() } },
        },
      },
      '3.2',
    )
    expect(errors).toStrictEqual([
      {
        path: '/paths/~1test/get/callbacks/x-event/{$request.query.url}/post/parameters/1',
        message:
          'Duplicate parameter "test" in "query"; first declared at /paths/~1test/get/callbacks/x-event/{$request.query.url}/post/parameters/0.',
      },
      {
        path: '/webhooks/x-hook/query/parameters/1',
        message: 'Duplicate parameter "test" in "query"; first declared at /webhooks/x-hook/query/parameters/0.',
      },
      {
        path: '/webhooks/x-hook/additionalOperations/COPY/parameters/1',
        message:
          'Duplicate parameter "test" in "query"; first declared at /webhooks/x-hook/additionalOperations/COPY/parameters/0.',
      },
      {
        path: '/components/pathItems/Unused/parameters/1',
        message: 'Duplicate parameter "test" in "query"; first declared at /components/pathItems/Unused/parameters/0.',
      },
    ])
  })

  it('terminates recursive callbacks while checking other paths', () => {
    expect(
      validateDuplicateParameters(
        {
          paths: {
            '/cycle': { get: { callbacks: { again: { '{$request.query.url}': { $ref: '#/paths/~1cycle' } } } } },
            '/test': { get: { parameters: [query, query] } },
          },
        },
        '3.1',
      ),
    ).toStrictEqual([duplicate])
  })

  it('ignores examples and extension data', () => {
    const data = { parameters: [query, query] }
    expect(
      validateDuplicateParameters(
        {
          paths: {
            'x-data': data,
            '/test': {
              'x-data': data,
              get: { 'x-data': data, responses: { '200': { content: { 'application/json': { example: data } } } } },
            },
          },
          components: { schemas: { Data: { example: data } } },
        },
        '3.1',
      ),
    ).toStrictEqual([])
  })

  it.each(['2.0', '3.0', '3.1'] as const)('ignores methods introduced in later versions than %s', (version) => {
    expect(
      validateDuplicateParameters(
        {
          paths: {
            '/test': {
              query: { parameters: [query, query] },
              additionalOperations: { COPY: { parameters: [query, query] } },
            },
          },
        },
        version,
      ),
    ).toStrictEqual([])
  })
})
