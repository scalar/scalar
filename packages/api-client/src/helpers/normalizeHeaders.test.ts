import { describe, expect, it } from 'vitest'

import { normalizeHeaders } from './normalizeHeaders'

describe('normalizeHeaders', () => {
  it('transforms keys to lowercase', () => {
    expect(
      normalizeHeaders({
        Foo: 'bar',
      }),
    ).toMatchObject({
      foo: 'bar',
    })
  })
})
