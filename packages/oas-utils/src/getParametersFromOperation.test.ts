import { describe, expect, it } from 'vitest'

import { getParametersFromOperation } from './getParametersFromOperation'
import type { TransformedOperation } from './types'

describe('getParametersFromOperation', () => {
  it('operation query parameters', () => {
    const request = getParametersFromOperation(
      {
        httpVerb: 'GET',
        path: '/foobar',
        information: {
          parameters: [
            {
              in: 'query',
              name: 'api_key',
              required: true,
            },
          ],
        },
      },
      'query',
    )

    expect(request).toMatchObject([
      {
        name: 'api_key',
        value: '',
      },
    ])
  })

  it('path query parameters', () => {
    const request = getParametersFromOperation(
      {
        httpVerb: 'GET',
        path: '/foobar',
        pathParameters: [
          {
            in: 'query',
            name: 'api_key',
            required: true,
          },
        ],
      },
      'query',
    )

    expect(request).toMatchObject([
      {
        name: 'api_key',
        value: '',
      },
    ])
  })

  it('path + operation query parameters', () => {
    const request = getParametersFromOperation(
      {
        httpVerb: 'GET',
        path: '/foobar',
        operationId: 'foobar',
        name: 'foobar',
        description: '',
        pathParameters: [
          {
            in: 'query',
            name: 'foo',
            required: true,
          },
        ],
        information: {
          parameters: [
            {
              in: 'query',
              name: 'bar',
              required: true,
            },
          ],
        },
      },
      'query',
    )

    expect(request).toMatchObject([
      {
        name: 'foo',
        value: '',
      },
      {
        name: 'bar',
        value: '',
      },
    ])
  })

  it('parameters with `required` and `description`', () => {
    const request = getParametersFromOperation(
      {
        httpVerb: 'POST',
        path: '/foobar',
        pathParameters: [
          {
            name: 'api_token',
            in: 'query',
            description: 'Your API token',
            required: true,
          },
        ],
        information: {
          parameters: [
            {
              name: 'id',
              in: 'query',
              description: 'A Query Parameter',
            },
          ],
        },
      } as TransformedOperation,
      'query',
    )

    expect(request).toStrictEqual([
      {
        name: 'api_token',
        value: '',
        description: 'Your API token',
        required: true,
        enabled: true,
      },
    ])
  })

  it('parameters use example', () => {
    const request = getParametersFromOperation(
      {
        httpVerb: 'POST',
        path: '/foobar',
        information: {
          parameters: [
            {
              name: 'id',
              in: 'query',
              example: 123,
              required: true,
            },
          ],
        },
      } as TransformedOperation,
      'query',
    )

    expect(request).toStrictEqual([
      {
        name: 'id',
        description: null,
        value: 123,
        required: true,
        enabled: true,
      },
    ])
  })

  it('path parameters', () => {
    const request = getParametersFromOperation(
      {
        httpVerb: 'POST',
        path: '/pet/{petId}',
        information: {
          parameters: [
            {
              name: 'petId',
              in: 'path',
              description: 'Pet id to delete',
              required: true,
              schema: {
                type: 'integer',
                format: 'int64',
              },
            },
          ],
        },
      } as TransformedOperation,
      'path',
    )

    expect(request).toStrictEqual([
      {
        name: 'petId',
        description: 'Pet id to delete',
        value: 1,
        required: true,
        enabled: true,
      },
    ])
  })
})
