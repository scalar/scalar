import { createEchoServer } from '@scalar/echo-server'
import { type AddressInfo } from 'node:net'
import { describe, expect, it } from 'vitest'

import { sendRequest } from './sendRequest'

const createEchoServerOnAnyPort = (): number => {
  const { listen } = createEchoServer()
  const instance = listen(0)

  return Number((instance.address() as AddressInfo).port)
}

describe('sendRequest', () => {
  it('sends requests', async () => {
    const port = createEchoServerOnAnyPort()

    const request = {
      url: `http://127.0.0.1:${port}`,
    }

    const result = await sendRequest(request)

    expect(result?.response).toContain({
      method: 'GET',
      path: '/',
    })
  })

  it('replaces variables', async () => {
    const port = createEchoServerOnAnyPort()

    const request = {
      url: `http://127.0.0.1:${port}`,
      path: '{path}',
      parameters: [
        {
          name: 'path',
          value: 'example',
        },
      ],
    }

    const result = await sendRequest(request)

    expect(result?.response).toContain({
      method: 'GET',
      path: '/example',
    })
  })

  it('sends query parameters', async () => {
    const port = createEchoServerOnAnyPort()

    const request = {
      url: `http://127.0.0.1:${port}`,
      query: [
        {
          name: 'foo',
          value: 'bar',
        },
      ],
    }

    const result = await sendRequest(request)

    expect(result?.response?.query).toContain({
      foo: 'bar',
    })
  })

  it.todo('merges query parameters', async () => {
    const port = createEchoServerOnAnyPort()

    const request = {
      url: `http://127.0.0.1:${port}?example=parameter`,
      query: [
        {
          name: 'foo',
          value: 'bar',
        },
      ],
    }

    const result = await sendRequest(request)

    expect(result?.response?.query).toContain({
      example: 'parameter',
      foo: 'bar',
    })
  })
})
