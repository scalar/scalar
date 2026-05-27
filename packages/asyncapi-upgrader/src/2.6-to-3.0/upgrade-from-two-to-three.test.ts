import { describe, expect, it } from 'vitest'

import { upgradeFromTwoToThree } from './upgrade-from-two-to-three'

describe('upgradeFromTwoToThree', () => {
  it('bumps an AsyncAPI 2.x document to 3.0.0', () => {
    const document = upgradeFromTwoToThree({ asyncapi: '2.6.0', info: {} })

    expect(document.asyncapi).toBe('3.0.0')
  })

  it('leaves non-2.x documents untouched', () => {
    const document = { asyncapi: '1.2.0', info: {} }

    expect(upgradeFromTwoToThree(document)).toBe(document)
  })
})
