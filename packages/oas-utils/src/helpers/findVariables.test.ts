import { describe, expect, it } from 'vitest'

import { findVariables } from './findVariables'

describe('findVariables', () => {
  it('finds variables', async () => {
    expect(findVariables('http://{baseUrl}/foobar')).toEqual(['baseUrl'])
  })

  it('finds variables with double curly braces', async () => {
    expect(findVariables('http://{{baseUrl}}/foobar')).toEqual(['baseUrl'])
  })

  it('ignores whitespace', async () => {
    expect(findVariables('http://{ baseUrl }/foobar')).toEqual(['baseUrl'])
  })

  it('works with special characters', async () => {
    expect(findVariables('http://{Example123_}/foobar')).toEqual([
      'Example123_',
    ])
  })

  it('returns an empty array if there’s no variable', async () => {
    expect(findVariables('http://example.com/foobar')).toEqual([])
  })
})
