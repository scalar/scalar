import { createEchoServer } from '@scalar/echo-server'
import { describe, expect, it } from 'vitest'

import { tokenRequestUrl } from './'

const createEchoServerOnAnyPort = (): { address: string; port: number } => {
  const { listen } = createEchoServer()
  const instance = listen(0)

  return instance.address()
}

describe('tokenRequestUrl', () => {
  it('example', async () => {
    const { port } = createEchoServerOnAnyPort()

    const url = await tokenRequestUrl({
      oidcDiscoveryUrl: `http://localhost:${port}/.well-known/openid-configuration`,
      grantType: 'code',
      authUrl: `http://localhost:${port}/oauth2/authorize`,
      accessTokenUrl: `http://localhost:${port}/oauth2/token`,
      clientId: '123',
      clientSecret: 'secret',
      scope: 'profile',
    })

    expect(url).toContain(`http://localhost:${port}`)
    expect(url).toContain(`http://localhost:${port}/oauth2/authorize`)
    expect(url).toContain(`response_type=code`)
    expect(url).toContain(`client_id=123`)
  })
})
