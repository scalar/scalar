import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import { promisify } from 'node:util'

import type { HarRequest } from '@scalar/types/snippetz'
import { describe, expect, it } from 'vitest'

import { nodeFetch } from '../plugins/node/fetch/fetch'
import { nodeUndici } from '../plugins/node/undici/undici'
import { mergeCookieHeaders } from './cookies'

const cases = [
  { name: 'absent cookies', request: {}, expected: undefined },
  { name: 'empty cookies', request: { cookies: [] }, expected: undefined },
  {
    name: 'multiple cookies with an empty value',
    request: {
      cookies: [
        { name: 'session', value: 'abc123' },
        { name: 'empty', value: '' },
      ],
    },
    expected: 'session=abc123; empty=',
  },
  {
    name: 'special characters in structured cookies',
    request: { cookies: [{ name: 'a;b', value: 'a b+c==;%2F雪' }] },
    expected: 'a%3Bb=a%20b%2Bc%3D%3D%3B%252F%E9%9B%AA',
  },
  {
    name: 'already serialized headers',
    request: { headers: [{ name: 'cOoKiE', value: 'token=a+b==; escaped=%2F' }] },
    expected: 'token=a+b==; escaped=%2F',
  },
  {
    name: 'mixed header casing and structured cookies',
    request: {
      headers: [
        { name: 'cookie', value: 'existing=one' },
        { name: 'Cookie', value: 'other=%2F' },
      ],
      cookies: [{ name: 'session', value: 'abc123' }],
    },
    expected: 'existing=one; other=%2F; session=abc123',
  },
] satisfies { name: string; request: Partial<HarRequest>; expected: string | undefined }[]

describe('cookies', () => {
  it.each(cases)('merges $name without mutating the input', ({ request, expected }) => {
    const original = structuredClone(request)
    expect(mergeCookieHeaders(request)).toStrictEqual(
      expected === undefined ? [] : [{ name: 'Cookie', value: expected }],
    )
    expect(request).toStrictEqual(original)
  })

  it('preserves unrelated repeated headers and an explicitly empty cookie header', () => {
    expect(
      mergeCookieHeaders({
        headers: [
          { name: 'X-Test', value: 'one' },
          { name: 'cookie', value: '' },
          { name: 'X-Test', value: 'two' },
        ],
      }),
    ).toStrictEqual([
      { name: 'X-Test', value: 'one' },
      { name: 'X-Test', value: 'two' },
      { name: 'Cookie', value: '' },
    ])
  })

  for (const plugin of [nodeFetch, nodeUndici]) {
    it.each(cases)(
      `sends $name to a server using ${plugin.client}`,
      async ({ request, expected }) => {
        const received: { cookie: string | undefined; setCookie: string[] | undefined }[] = []
        const server = createServer((request, response) => {
          received.push({ cookie: request.headers.cookie, setCookie: request.headers['set-cookie'] })
          response.end('{}')
        })
        try {
          await new Promise<void>((resolve, reject) => {
            server.once('error', reject)
            server.listen(0, '127.0.0.1', resolve)
          })
          const address = server.address()
          if (!address || typeof address === 'string') {
            throw new Error('Expected a local server address')
          }
          const snippet = plugin.generate({ url: `http://127.0.0.1:${address.port}`, ...request })
          const undici = import.meta.resolve('undici')
          const source =
            plugin.client === 'fetch'
              ? `await (${snippet}).then(response => response.text())`
              : `${snippet.replace("from 'undici'", `from ${JSON.stringify(undici)}`)}\nawait body.dump();\nawait (await import(${JSON.stringify(undici)})).getGlobalDispatcher().destroy();`
          await promisify(execFile)(process.execPath, ['--input-type=module', '-e', source], { timeout: 10000 })
          expect(received).toStrictEqual([{ cookie: expected, setCookie: undefined }])
        } finally {
          server.closeAllConnections()
          await new Promise<void>((resolve) => server.close(() => resolve()))
        }
      },
      15000,
    )
  }
})
