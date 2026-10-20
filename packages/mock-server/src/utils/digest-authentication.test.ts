import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { createMockServer } from '../create-mock-server'

const hash = (value: string): string => createHash('md5').update(value).digest('hex')

describe('digest-authentication', () => {
  it('challenges and accepts a standard MD5 Digest exchange', async () => {
    const app = await createMockServer({
      logger: false,
      document: {
        openapi: '3.1.0',
        info: { title: 'Digest', version: '1' },
        components: { securitySchemes: { digest: { type: 'http', scheme: 'digest' } } },
        security: [{ digest: [] }],
        paths: { '/secret': { get: { responses: { '200': { description: 'OK' } } } } },
      },
    })
    const challenge = await app.request('/secret?x=1')
    expect(challenge.status).toBe(401)
    expect(challenge.headers.get('www-authenticate')).toBe(
      'Digest realm="Scalar Mock Server", nonce="scalar-mock-nonce", algorithm=MD5, qop="auth"',
    )
    const response = hash(
      `${hash('user:Scalar Mock Server:password')}:scalar-mock-nonce:00000001:client:auth:${hash('GET:/secret?x=1')}`,
    )
    const authorization = `digest username="user", realm="Scalar Mock Server", nonce="scalar-mock-nonce", uri="/secret?x=1", algorithm=MD5, qop=auth, nc=00000001, cnonce="client", response="${response}"`
    expect((await app.request('/secret?x=1', { headers: { Authorization: authorization } })).status).toBe(200)
    for (const invalid of [
      authorization.replace('scalar-mock-nonce', 'wrong'),
      authorization.replace('/secret?x=1', '/wrong'),
      authorization.replace(response, 'invalid'),
      `${authorization}, username="duplicate"`,
      'Digest invalid',
    ]) {
      expect((await app.request('/secret?x=1', { headers: { Authorization: invalid } })).status).toBe(401)
    }
  })
})
