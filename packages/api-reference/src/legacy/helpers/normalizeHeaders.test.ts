import { describe, expect, it } from 'vitest'

import { normalizeHeaders } from './normalizeHeaders'

describe('normalizeHeaders', () => {
  it('works with objects', () => {
    expect(
      normalizeHeaders({
        'Foo-bar': 'bar',
      }),
    ).toMatchObject({
      'Foo-Bar': 'bar',
    })
  })

  // Removes duplicates in arrays
  it('removes duplicates in arrays', () => {
    expect(
      normalizeHeaders([
        {
          name: 'fOo-bAr',
          value: 'don’t keep this one',
        },
        {
          name: 'fOo-bAr',
          value: 'example2',
        },
      ]),
    ).toMatchObject([
      {
        name: 'Foo-Bar',
        value: 'example2',
      },
    ])
  })

  it('works with array', () => {
    expect(
      normalizeHeaders([
        {
          name: 'fOo-bAr',
          value: 'example',
        },
      ]),
    ).toMatchObject([
      {
        name: 'Foo-Bar',
        value: 'example',
      },
    ])
  })

  it('removes duplicates in objects', () => {
    expect(
      normalizeHeaders({
        'Content-Type': 'application/json',
        'cOnTeNt-tYpe': 'text/html',
      }),
    ).toMatchObject({
      'Content-Type': 'text/html',
    })
  })
})
