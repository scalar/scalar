import { describe, expect, it } from 'vitest'

import { getParametersFromOperation } from './get-parameters-from-operation'

describe('getParametersFromOperation', () => {
  it('operation query parameters', () => {
    const request = getParametersFromOperation(
      [],
      [
        {
          in: 'query',
          name: 'api_key',
          required: true,
        },
      ],
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
      [
        {
          in: 'query',
          name: 'api_key',
          required: true,
          deprecated: false,
        },
      ],
      [],
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
      [
        {
          in: 'query',
          name: 'foo',
          required: true,
          deprecated: false,
        },
      ],
      [
        {
          in: 'query',
          name: 'bar',
          required: true,
        },
      ],
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

  it('parameters with `required` and `description`', () => {
    const request = getParametersFromOperation(
      [
        {
          name: 'api_token',
          in: 'query',
          description: 'Your API token',
          required: true,
          deprecated: false,
        },
      ],
      [
        {
          name: 'id',
          in: 'query',
          description: 'A Query Parameter',
        },
      ],
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
      [],
      [
        {
          name: 'id',
          in: 'query',
          example: 123,
          required: true,
        },
      ],
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
      [],
      [
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
