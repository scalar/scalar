import { describe, expect, it } from 'vitest'

import { getQueryParametersFromOperation } from './getQueryParametersFromOperation'

describe('getQueryParametersFromOperation', () => {
  it('operation query parameters', () => {
    const request = getQueryParametersFromOperation({
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
    })

    expect(request).toMatchObject([
      {
        name: 'api_key',
        value: '',
      },
    ])
  })

  it('path query parameters', () => {
    const request = getQueryParametersFromOperation({
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
    })

    expect(request).toMatchObject([
      {
        name: 'api_key',
        value: '',
      },
    ])
  })

  it('path + operation query parameters', () => {
    const request = getQueryParametersFromOperation({
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
    })

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
