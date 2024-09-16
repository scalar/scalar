import { describe, expect, it } from 'vitest'

import { createRequest } from './createRequest'
import { getExampleCode } from './getExampleCode'

describe('getExampleCode', () => {
  it('generates a basic curl example (httpsnippet-lite)', async () => {
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

  it('generates a basic undici example (@scalar/snippetz)', async () => {
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
})
