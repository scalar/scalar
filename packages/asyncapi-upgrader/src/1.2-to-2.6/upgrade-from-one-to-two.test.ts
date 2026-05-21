import { describe, expect, it } from 'vitest'

import { upgradeFromOneToTwo } from './upgrade-from-one-to-two'

describe('upgradeFromOneToTwo', () => {
  it('bumps an AsyncAPI 1.x document to 2.6.0', () => {
    const document = upgradeFromOneToTwo({ asyncapi: '1.2.0', info: {} })

    expect(document.asyncapi).toBe('2.6.0')
  })

  it('leaves non-1.x documents untouched', () => {
    const document = { asyncapi: '3.0.0', info: {} }

    expect(upgradeFromOneToTwo(document)).toBe(document)
  })
})
