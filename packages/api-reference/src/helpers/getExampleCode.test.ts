import { describe, expect, it } from 'vitest'

import { getExampleCode } from './getExampleCode'

describe('getExampleCode', () => {
  it('generates a basic shell/curl example (httpsnippet-lite)', async () => {
    const result = await getExampleCode(
      new Request('https://example.com', {
        method: 'POST',
      }),
      'shell',
      'curl',
    )

    expect(result).toContain('curl https://example.com')
    expect(result).toContain('--request POST')
  })

  it('generates a basic node/undici example (@scalar/snippetz)', async () => {
    const result = await getExampleCode(
      new Request('https://example.com', {
        method: 'POST',
      }),
      'node',
      'undici',
    )

    expect(result).toContain(`import { request } from 'undici'`)
    expect(result).toContain('https://example.com')
    expect(result).toContain(`method: 'POST'`)
  })

  it('generates a basic javascript/jquery example (httpsnippet-lite)', async () => {
    const result = await getExampleCode(
      new Request('https://example.com', {
        method: 'POST',
      }),
      'javascript',
      'jquery',
    )

    expect(result).toContain('$.ajax')
  })

  it('returns an empty string if passed rubbish', async () => {
    const result = await getExampleCode(
      new Request('https://example.com', {
        method: 'POST',
      }),
      'fantasy',
      'blue',
    )

    expect(result).toBe('')
  })

  it('returns an empty string if passed undefined target', async () => {
    const result = await getExampleCode(
      new Request('https://example.com', {
        method: 'POST',
      }),
      // @ts-expect-error passing in rubbish
      undefined,
      'blue',
    )

    expect(result).toBe('')
  })

  it('shows the escaped variables in the url', async () => {
    const result = await getExampleCode(
      new Request('https://example.com/users/{userId}', {
        method: 'POST',
      }),
      'javascript',
      'fetch',
    )

    expect(result).toContain('https://example.com/users/%7BuserId%7D')
  })

  it('shows the original path before variable replacement', async () => {
    const result = await getExampleCode(
      new Request('https://example.com/users/{userId}', {
        method: 'POST',
      }),
      'javascript',
      'fetch',
      '/users/{userId}',
    )

    expect(result).toContain('https://example.com/users/{userId}')
  })
})
