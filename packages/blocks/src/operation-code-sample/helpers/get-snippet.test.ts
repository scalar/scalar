import { AVAILABLE_CLIENTS, type ClientId, type TargetId } from '@scalar/snippetz'
import type { Request as HarRequest } from 'har-format'
import { describe, expect, it } from 'vitest'

import { getSnippet } from './get-snippet'

const EMPTY_TOKEN_PLACEHOLDER = 'YOUR_SECRET_TOKEN'

const makeHarRequest = (overrides: Partial<HarRequest> = {}): HarRequest => ({
  method: 'GET',
  url: 'https://example.com/users',
  headers: [],
  queryString: [],
  cookies: [],
  headersSize: 0,
  bodySize: 0,
  httpVersion: 'HTTP/1.1',
  ...overrides,
})

describe('getSnippet', () => {
  it('generates a basic shell/curl example (httpsnippet-lite)', () => {
    const [error, result] = getSnippet('shell', 'curl', makeHarRequest())

    expect(error).toBeNull()
    expect(result).toEqual('curl https://example.com/users')
  })

  it('generates a basic node/undici example (@scalar/snippetz)', () => {
    const [error, result] = getSnippet('node', 'undici', makeHarRequest())

    expect(error).toBeNull()
    expect(result).toMatchInlineSnapshot(`
      "import { request } from 'undici'

      const { statusCode, body } = await request('https://example.com/users')"
    `)
  })

  it('generates a basic javascript/jquery example (httpsnippet-lite)', () => {
    const [error, result] = getSnippet('javascript', 'jquery', makeHarRequest())

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
    const [error, result] = getSnippet('javascript', 'invalid-client' as any, makeHarRequest())

    expect(error).toBeDefined()
    expect(result).toBeNull()
  })

  it('shows the original path before variable replacement', () => {
    const [error, result] = getSnippet(
      'javascript',
      'fetch',
      makeHarRequest({ url: 'https://void.scalar.com/{path}/users' }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://void.scalar.com/{path}/users')`)
  })

  it('should show the accept header if its not */*', () => {
    const [error, result] = getSnippet(
      'javascript',
      'fetch',
      makeHarRequest({
        headers: [{ name: 'Accept', value: 'application/json' }],
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users', {
  headers: {
    Accept: 'application/json'
  }
})`)
  })

  it('show should show the cookies', async () => {
    const [error, result] = await getSnippet(
      'javascript',
      'fetch',
      makeHarRequest({
        headers: [{ name: 'Set-Cookie', value: 'sessionId=abc123' }],
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users', {
  headers: {
    'Set-Cookie': 'sessionId=abc123'
  }
})`)
  })

  it('should show the headers', () => {
    const [error, result] = getSnippet(
      'javascript',
      'fetch',
      makeHarRequest({
        headers: [{ name: 'X-Scalar-Token', value: 'abc123' }],
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users', {
  headers: {
    'X-Scalar-Token': 'abc123'
  }
})`)
  })

  it('should show the query parameters', () => {
    const [error, result] = getSnippet(
      'javascript',
      'fetch',
      makeHarRequest({
        queryString: [{ name: 'query-param', value: 'query-value' }],
      }),
    )

    expect(error).toBeNull()
    expect(result).toEqual(`fetch('https://example.com/users?query-param=query-value')`)
  })

  it('should show the security headers, cookies and query', () => {
    const [error, result] = getSnippet(
      'javascript',
      'fetch',
      makeHarRequest({
        queryString: [{ name: 'query-api-key', value: '33333' }],
        headers: [
          { name: 'X-Header-Token', value: '22222' },
          { name: 'Authorization', value: 'Bearer 44444' },
          { name: 'Set-Cookie', value: `x-cookie-token=${EMPTY_TOKEN_PLACEHOLDER}` },
        ],
      }),
    )

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
    const [error, result] = getSnippet('c', 'libcurl', makeHarRequest({ url: '/users' }))

    expect(error).toBeNull()
    expect(result).toMatchInlineSnapshot(`
      "#include <curl/curl.h>

      int main(void) {
        curl_global_init(CURL_GLOBAL_DEFAULT);
        CURL *curl = curl_easy_init();
        if (!curl) {
          curl_global_cleanup();
          return 1;
        }

        curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "GET");
        curl_easy_setopt(curl, CURLOPT_URL, "/users");

        CURLcode res = curl_easy_perform(curl);
        curl_easy_cleanup(curl);
        curl_global_cleanup();

        return (int)res;
      }"
    `)
  })

  describe('it should generate a snipped without a proper URL for every client', () => {
    AVAILABLE_CLIENTS.forEach((id) => {
      it(id, () => {
        const [target, client] = id.split('/') as [TargetId, ClientId<TargetId>]
        const [error, result] = getSnippet(target, client, makeHarRequest({ url: '/super-secret-path' }))

        expect(error).toBeNull()
        expect(result).toContain('/super-secret-path')
      })
    })
  })
})
