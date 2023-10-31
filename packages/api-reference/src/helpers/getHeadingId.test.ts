import { describe, expect, it } from 'vitest'

import { getHeadingId } from './getHeadingId'

describe('getHeadingId', () => {
  it('returns a string that includes the slug', async () => {
    expect(
      getHeadingId({
        depth: 0,
        value: 'foobar',
        slug: 'foobar',
      }),
    ).toContain('foobar')
  })
})
