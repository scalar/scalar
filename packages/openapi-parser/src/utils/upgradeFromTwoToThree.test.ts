import { describe, expect, it } from 'vitest'

import { upgradeFromTwoToThree } from './upgradeFromTwoToThree'

describe('upgradeFromTwoToThree', () => {
  it('changes the version to from 3.0.0 to 3.1.0', async () => {
    const result = upgradeFromTwoToThree({
      swagger: '2.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(result.openapi).toBe('3.0.3')
    expect(result.swagger).toBeUndefined()
  })
})
