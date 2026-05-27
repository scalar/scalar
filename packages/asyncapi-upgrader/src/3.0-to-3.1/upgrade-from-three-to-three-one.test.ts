import { describe, expect, it } from 'vitest'

import { upgradeFromThreeToThreeOne } from './upgrade-from-three-to-three-one'

describe('upgradeFromThreeToThreeOne', () => {
  it('bumps an AsyncAPI 3.0 document to 3.1.0', () => {
    const document = upgradeFromThreeToThreeOne({ asyncapi: '3.0.0', info: {} })

    expect(document.asyncapi).toBe('3.1.0')
  })

  it('leaves non-3.0 documents untouched', () => {
    const document = { asyncapi: '2.6.0', info: {} }

    expect(upgradeFromThreeToThreeOne(document)).toBe(document)
  })
})
