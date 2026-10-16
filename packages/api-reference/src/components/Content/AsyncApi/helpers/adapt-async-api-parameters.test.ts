import type { AsyncApiChannelObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { adaptAsyncApiParameters } from './adapt-async-api-parameters'

describe('adaptAsyncApiParameters', () => {
  it('returns an empty array when there are no parameters', () => {
    expect(adaptAsyncApiParameters(undefined)).toEqual([])
  })

  it('maps a parameter to a required path parameter with a string schema', () => {
    const parameters: AsyncApiChannelObject['parameters'] = {
      userId: { description: 'The user id' },
    }

    expect(adaptAsyncApiParameters(parameters)).toEqual([
      {
        name: 'userId',
        in: 'path',
        required: true,
        description: 'The user id',
        schema: { type: 'string' },
      },
    ])
  })

  it('folds enum, default, and examples onto the schema', () => {
    const parameters: AsyncApiChannelObject['parameters'] = {
      env: {
        enum: ['staging', 'production'],
        default: 'production',
        examples: ['staging'],
      },
    }

    expect(adaptAsyncApiParameters(parameters)).toEqual([
      {
        name: 'env',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          enum: ['staging', 'production'],
          default: 'production',
          examples: ['staging'],
        },
      },
    ])
  })

  it('omits the description when it is missing', () => {
    const parameters: AsyncApiChannelObject['parameters'] = {
      userId: {},
    }

    const [parameter] = adaptAsyncApiParameters(parameters)
    expect(parameter).not.toHaveProperty('description')
    expect(parameter).not.toHaveProperty('location')
  })

  it('preserves the location alongside existing parameter details', () => {
    expect(
      adaptAsyncApiParameters({
        userId: {
          description: 'The user id',
          location: '$message.payload#/user/id',
          enum: ['alice', 'bob'],
          default: 'alice',
          examples: ['bob'],
        },
      }),
    ).toStrictEqual([
      {
        name: 'userId',
        in: 'path',
        required: true,
        description: 'The user id',
        location: '$message.payload#/user/id',
        schema: { type: 'string', enum: ['alice', 'bob'], default: 'alice', examples: ['bob'] },
      },
    ])
  })

  it('keeps unresolved reference parameters visible without a location', () => {
    expect(adaptAsyncApiParameters({ userId: { $ref: '#/components/parameters/missing' } })).toStrictEqual([
      { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
    ])
  })

  it('resolves $ref parameters', () => {
    const parameters = {
      userId: {
        $ref: '#/components/parameters/userId',
        '$ref-value': { description: 'Resolved user id', location: '$message.header#/userId' },
      },
    } as unknown as AsyncApiChannelObject['parameters']

    expect(adaptAsyncApiParameters(parameters)).toEqual([
      {
        name: 'userId',
        in: 'path',
        required: true,
        description: 'Resolved user id',
        location: '$message.header#/userId',
        schema: { type: 'string' },
      },
    ])
  })
})
