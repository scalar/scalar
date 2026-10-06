import { describe, expect, it } from 'vitest'

import { validate } from './validate'
import { validateCookieParameters } from './validate-cookie-parameters'

const parameter = {
  name: 'color',
  in: 'cookie',
  style: 'form',
  explode: false,
  schema: { type: 'array', items: { type: 'string' } },
}
const message =
  'Cookie parameter "color" cannot serialize an array or object with style: form and explode: false because comma-separated cookie values are invalid. Use style: cookie with explode: true.'
const document = {
  openapi: '3.2.1',
  info: { title: 'Cookies', version: '1' },
  paths: { '/': { get: { parameters: [parameter], responses: { '200': { description: 'OK' } } } } },
}

describe('validate-cookie-parameters', () => {
  it('reports a declaration through the standalone validator and honors throwOnError', () => {
    const result = validate(document)
    expect(result.valid).toBe(false)
    expect(result.errors).toStrictEqual([{ path: ['paths', '/', 'get', 'parameters', '0', 'explode'], message }])
    expect(() => validate(document, { throwOnError: true })).toThrow(message)
    expect(validate(document, { checkCookieParameters: false }).valid).toBe(true)
  })

  it.each(['3.2.0', '3.2.1'])('checks %s while accepting repaired declarations', (openapi) => {
    expect(validateCookieParameters({ ...document, openapi })).toStrictEqual([
      { path: ['paths', '/', 'get', 'parameters', '0', 'explode'], message },
    ])
    const repaired = { ...parameter, style: 'cookie', explode: true }
    expect(
      validate({
        ...document,
        paths: { '/': { get: { parameters: [repaired], responses: { '200': { description: 'OK' } } } } },
      }).valid,
    ).toBe(true)
  })

  it.each(['3.0.4', '3.1.2', '3.10.0', undefined])('preserves earlier and unknown versions: %s', (openapi) => {
    expect(validateCookieParameters({ ...document, openapi })).toStrictEqual([])
  })

  it('checks path items, query, additional methods, callbacks, webhooks and reusable parameters', () => {
    const pathItem = {
      parameters: [parameter],
      query: { parameters: [parameter] },
      additionalOperations: { PURGE: { parameters: [parameter] } },
    }
    const result = validateCookieParameters({
      openapi: '3.2.1',
      paths: { '/': { post: { callbacks: { updated: { '{$request.query.url}': pathItem } } } } },
      webhooks: { event: { get: { parameters: [parameter] } } },
      components: { parameters: { Color: parameter }, pathItems: { Shared: { parameters: [parameter] } } },
    })
    expect(result.map(({ path }) => path)).toStrictEqual([
      ['paths', '/', 'post', 'callbacks', 'updated', '{$request.query.url}', 'parameters', '0', 'explode'],
      ['paths', '/', 'post', 'callbacks', 'updated', '{$request.query.url}', 'query', 'parameters', '0', 'explode'],
      [
        'paths',
        '/',
        'post',
        'callbacks',
        'updated',
        '{$request.query.url}',
        'additionalOperations',
        'PURGE',
        'parameters',
        '0',
        'explode',
      ],
      ['webhooks', 'event', 'get', 'parameters', '0', 'explode'],
      ['components', 'parameters', 'Color', 'explode'],
      ['components', 'pathItems', 'Shared', 'parameters', '0', 'explode'],
    ])
  })

  it('does not interpret examples, extensions or content-based parameters as declarations', () => {
    expect(
      validateCookieParameters({
        openapi: '3.2.1',
        paths: {
          '/': {
            get: {
              parameters: [
                { name: 'data', in: 'query', schema: { example: parameter } },
                { name: 'data', in: 'cookie', content: { 'application/json': { schema: parameter.schema } } },
              ],
              'x-data': { parameters: [parameter] },
            },
          },
        },
        'x-data': { parameters: [parameter] },
      }),
    ).toStrictEqual([])
  })
})
