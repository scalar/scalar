import { describe, expect, it } from 'vitest'

import { convert } from './convert'
import collectionV2 from './fixtures/collection-v2.json?raw'

describe('convert', () => {
  it('converts the Postman default example', async () => {
    const result = await convert(collectionV2)

    expect(result).toBeTypeOf('string')
  })
})
