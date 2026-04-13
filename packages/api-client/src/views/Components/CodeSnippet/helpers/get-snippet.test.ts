import { AVAILABLE_CLIENTS, type ClientId, type TargetId } from '@scalar/snippetz'
import type { Request as HarRequest } from 'har-format'
import { describe, expect, it } from 'vitest'

import { getSnippet } from './get-snippet'

const EMPTY_TOKEN_PLACEHOLDER = 'YOUR_SECRET_TOKEN'

describe('getSnippet', () => {
  it('generates a basic shell/curl example (httpsnippet-lite)', () => {
    const [error, result] = getSnippet('shell', 'curl')

    expect(error).toBeNull()
    expect(result).toEqual('curl https://example.com/users')
  })

  it('generates a basic node/undici example (@scalar/snippetz)', () => {
    const [error, result] = getSnippet('node', 'undici')

    expect(error).toBeNull()
    expect(result).toMatchInlineSnapshot(`
      "import { request } from 'undici'

      const { statusCode, body } = await request('https://example.com/users')"
    `)
  })

  it('generates a basic javascript/jquery example (httpsnippet-lite)', () => {
    const [error, result] = getSnippet('javascript', 'jquery')

    expect(error).toBeNull()
    expect(result).toMatchInlineSnapshot(`
      "const settings = {
        async: true,
        crossDomain: true,
        url: 'https://example.com/users',
        method: 'GET',
        headers: {}
      };

      $.ajax(settings).done(function (response) {
        console.log(response);
      });"
    `)
  })

  it('returns an empty string if passed rubbish', () => {
    const [error, result] = getSnippet('javascript', 'invalid-client' as any)

    expect(error).toBeDefined()
    expect(result).toBeNull()
  })

  it('shows the original path before variable replacement', () => {
    const [error, result] = getSnippet('javascript', 'fetch')

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://void.scalar.com/{path}/users')`)
  })

  it('should show the accept header if its not */*', () => {
    const [error, result] = getSnippet('javascript', 'fetch')

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users', {
  headers: {
    Accept: 'application/json'
  }
})`)
  })

  it('show should show the cookies', async () => {
    const [error, result] = await getSnippet('javascript', 'fetch')

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users', {
  headers: {
    'Set-Cookie': 'sessionId=abc123'
  }
})`)
  })

  it('should show the headers', () => {
    const [error, result] = getSnippet('javascript', 'fetch')

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users', {
  headers: {
    'X-Scalar-Token': 'abc123'
  }
})`)
  })

  it('should show the query parameters', () => {
    const [error, result] = getSnippet('javascript', 'fetch')

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users?query-param=query-value')`)
  })

  it('should show the security headers, cookies and query', () => {
    const [error, result] = getSnippet('javascript', 'fetch')

    expect(error).toBeNull()
    expect(result).toMatchInlineSnapshot(`
      "fetch('https://example.com/users?query-api-key=33333', {
        headers: {
          'X-Header-Token': '22222',
          Authorization: 'Bearer 44444',
          'Set-Cookie': 'x-cookie-token=YOUR_SECRET_TOKEN'
        }
      })"
    `)
  })

  it('should include the invalid url', () => {
    const [error, result] = getSnippet('c', 'libcurl')

    expect(error).toBeNull()
    expect(result).toMatchInlineSnapshot(`
      "CURL *hnd = curl_easy_init();

      curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "GET");
      curl_easy_setopt(hnd, CURLOPT_URL, "/users");

      CURLcode ret = curl_easy_perform(hnd);"
    `)
  })

  describe('it should generate a snipped without a proper URL for every client', () => {
    AVAILABLE_CLIENTS.forEach((id) => {
      it(id, () => {
        const [target, client] = id.split('/') as [TargetId, ClientId<TargetId>]
        const [error, result] = getSnippet(target, client)

        expect(error).toBeNull()
        expect(result).toContain('/super-secret-path')
      })
    })
  })
})
