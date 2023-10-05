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

    expect(
      await tokenRequestUrl({
        oidcDiscoveryUrl: `http://localhost:${port}/.well-known/openid-configuration`,
        grantType: 'code',
        authUrl: `http://localhost:${port}/oauth2/authorize`,
        accessTokenUrl: `http://localhost:${port}/oauth2/token`,
        clientId: '123',
        clientSecret: 'secret',
        scope: 'profile',
      }),
    ).toBe(
      `http://localhost:${port}/authorize?response_type=code&client_id=123&state=foobar&scope=profile&redirect_uri=&code_challenge=foobar&code_challenge_method=S256`,
    )
  })
})
