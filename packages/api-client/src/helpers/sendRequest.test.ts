import { createEchoServer } from '@scalar/echo-server'
import { describe, expect, it } from 'vitest'

import { sendRequest } from './sendRequest'

const createEchoServerOnAnyPort = (): { address: string; port: number } => {
  const { listen } = createEchoServer()
  const instance = listen(0)

  return instance.address()
}

describe('sendRequest', () => {
  it('sends requests', async () => {
    const { port } = createEchoServerOnAnyPort()

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
    const { port } = createEchoServerOnAnyPort()

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
})
