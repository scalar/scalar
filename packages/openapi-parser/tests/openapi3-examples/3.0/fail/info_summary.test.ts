import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import info_summary from './info_summary.yaml?raw'

describe('info_summary', () => {
  it('returns an error', async () => {
    const result = await validate(info_summary)

    expect(result.errors?.[0]?.message).toBe(
      'Property summary is not expected to be here',
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
