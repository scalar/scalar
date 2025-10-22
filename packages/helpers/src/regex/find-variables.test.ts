import { describe, expect, it } from 'vitest'

import { findVariables } from './find-variables'

describe('findVariables', () => {
  it('finds variables', () => {
    expect(findVariables('http://{baseUrl}/foobar')).toEqual(['baseUrl'])
  })

  it('finds variables with double curly braces', () => {
    expect(findVariables('http://{{baseUrl}}/foobar')).toEqual(['baseUrl'])
  })

  it('ignores whitespace', () => {
    expect(findVariables('http://{ baseUrl }/foobar')).toEqual(['baseUrl'])
  })

  it('works with special characters', () => {
    expect(findVariables('http://{Example123_}/foobar')).toEqual(['Example123_'])
  })

  it("returns an empty array if there's no variable", () => {
    expect(findVariables('http://example.com/foobar')).toEqual([])
  })
})
