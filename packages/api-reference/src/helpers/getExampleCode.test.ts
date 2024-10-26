import { describe, expect, it } from 'vitest'

import { createRequest } from './createRequest'
import { getExampleCode } from './getExampleCode'

describe('getExampleCode', () => {
  it('generates a basic shell/curl example (httpsnippet-lite)', async () => {
    const result = await getExampleCode(
      createRequest({
        method: 'POST',
        url: 'https://example.com',
      }),
      'shell',
      'curl',
    )

    expect(result).toContain('curl')
    expect(result).toContain('--request POST')
    expect(result).toContain('--url https://example.com')
  })

  it('generates a basic node/undici example (@scalar/snippetz)', async () => {
    const result = await getExampleCode(
      createRequest({
        method: 'POST',
        url: 'https://example.com',
      }),
      'node',
      'undici',
    )

    expect(result).toContain(`import { request } from 'undici'`)
    expect(result).toContain(`'https://example.com'`)
    expect(result).toContain(`method: 'POST'`)
  })

  it('generates a basic javascript/jquery example (httpsnippet-lite)', async () => {
    const result = await getExampleCode(
      createRequest({
        method: 'POST',
        url: 'https://example.com',
      }),
      'javascript',
      'jquery',
    )

    expect(result).toContain('$.ajax')
  })

  it('works with js and javascript (httpsnippet-lite)', async () => {
    const result1 = await getExampleCode(
      createRequest({
        method: 'POST',
        url: 'https://example.com',
      }),
      'js',
      'jquery',
    )

    const result2 = await getExampleCode(
      createRequest({
        method: 'POST',
        url: 'https://example.com',
      }),
      'javascript',
      'jquery',
    )

    expect(result1).toBe(result2)
  })

  it('returns an empty string if passed rubbish', async () => {
    const result = await getExampleCode(
      createRequest({
        method: 'POST',
        url: 'https://example.com',
      }),
      // @ts-expect-error TODO
      'fantasy',
      'blue',
    )

    expect(result).toBe('')
  })

  it('returns an empty string if passed undefined target', async () => {
    const result = await getExampleCode(
      createRequest({
        method: 'POST',
        url: 'https://example.com',
      }),
      // @ts-expect-error TODO
      undefined,
      'blue',
    )

    expect(result).toBe('')
  })
})
