import { describe, expect, it } from 'vitest'

import { replaceVariables } from './replaceVariables'

describe('replaceVariables', () => {
  it('replaces variables', async () => {
    expect(
      replaceVariables('http://{baseUrl}/foobar', {
        baseUrl: 'example.com',
      }),
    ).toBe('http://example.com/foobar')
  })
})
