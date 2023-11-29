import { describe, expect, it } from 'vitest'

import { getParametersFromOperation } from './getParametersFromOperation'

describe('getParametersFromOperation', () => {
  it('operation query parameters', () => {
    const request = getParametersFromOperation(
      {
        httpVerb: 'GET',
        path: '/foobar',
        operationId: 'foobar',
        name: 'foobar',
        description: '',
        information: {
          parameters: [
            {
              in: 'query',
              name: 'api_key',
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
        operationId: 'foobar',
        name: 'foobar',
        description: '',
        pathParameters: [
          {
            in: 'query',
            name: 'api_key',
          },
        ],
        information: {},
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
          },
        ],
        information: {
          parameters: [
            {
              in: 'query',
              name: 'bar',
            },
          ],
        },
      },
      'query',
    )

    expect(request).toMatchObject([
      {
        name: 'bar',
        value: '',
      },
      {
        name: 'foo',
        value: '',
      },
    ])
  })
})
