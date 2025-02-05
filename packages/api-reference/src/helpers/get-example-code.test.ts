import {
  type Operation,
  type RequestExample,
  type Server,
  operationSchema,
  requestExampleSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { beforeEach, describe, expect, it } from 'vitest'

import { getExampleCode } from './get-example-code'

describe('getExampleCode', () => {
  let operation: Operation
  let example: RequestExample
  let server: Server

  beforeEach(() => {
    operation = operationSchema.parse({
      method: 'get',
      path: '/users',
      requestBody: undefined,
    })
    example = requestExampleSchema.parse({})
    server = serverSchema.parse({
      url: 'https://example.com',
    })
  })

  it('generates a basic shell/curl example (httpsnippet-lite)', async () => {
    const result = await getExampleCode(
      operation,
      example,
      'shell',
      'curl',
      server,
    )

    expect(result).toEqual(`curl https://example.com/users \\
  --header 'Accept: */*'`)
  })

  it('generates a basic node/undici example (@scalar/snippetz)', async () => {
    const result = await getExampleCode(
      operation,
      example,
      'node',
      'undici',
      server,
    )

    expect(result).toEqual(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com/users', {
  headers: {
    Accept: '*/*'
  }
})`)
  })

  it('generates a basic javascript/jquery example (httpsnippet-lite)', async () => {
    const result = await getExampleCode(
      operation,
      example,
      'javascript',
      'jquery',
      server,
    )

    expect(result).toEqual(`const settings = {
  async: true,
  crossDomain: true,
  url: 'https://example.com/users',
  method: 'GET',
  headers: {
    Accept: '*/*'
  }
};

$.ajax(settings).done(function (response) {
  console.log(response);
});`)
  })

  it('returns an empty string if passed rubbish', async () => {
    const result = await getExampleCode(
      operation,
      example,
      'fantasy',
      'blue',
      server,
    )

    expect(result).toBe('')
  })

  it('returns an empty string if passed undefined target', async () => {
    const result = await getExampleCode(
      operation,
      example,
      // @ts-expect-error passing in rubbish
      undefined,
      'blue',
      server,
    )

    expect(result).toBe('')
  })

  it('shows the original path before variable replacement', async () => {
    server = serverSchema.parse({
      uid: 'server-uid',
      url: '{protocol}://void.scalar.com/{path}',
      description: 'Responds with your request data',
      variables: {
        protocol: {
          enum: ['https'],
          default: 'https',
        },
        path: {
          default: '',
        },
      },
    })

    const result = await getExampleCode(
      operation,
      example,
      'javascript',
      'fetch',
      server,
    )

    expect(result).toEqual(`fetch('{protocol}://void.scalar.com/{path}/users', {
  headers: {
    Accept: '*/*'
  }
})`)
  })
})
