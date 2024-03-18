import { describe, expect, it } from 'vitest'

import { normalize } from './normalize'

describe('normalize', () => {
  it('returns object when given an object', () => {
    expect(normalize({ foo: 'bar ' })).toMatchObject({ foo: 'bar ' })
  })

  it('returns object when given a string', () => {
    expect(normalize(JSON.stringify({ foo: 'bar ' }))).toMatchObject({
      foo: 'bar ',
    })
  })
})
