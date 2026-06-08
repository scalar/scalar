import { describe, expect, it } from 'vitest'

import { getRenderableSdks } from './renderable-sdks'

describe('getRenderableSdks', () => {
  it('returns an empty array for undefined', () => {
    expect(getRenderableSdks(undefined)).toEqual([])
  })

  it('keeps entries that have a description', () => {
    const sdks = [
      { lang: 'TypeScript', description: 'Install for TypeScript' },
      { lang: 'Python', description: 'Install for Python' },
    ]

    expect(getRenderableSdks(sdks)).toEqual(sdks)
  })

  it('drops entries without a description', () => {
    expect(
      getRenderableSdks([{ lang: 'TypeScript', description: 'Install for TypeScript' }, { lang: 'Empty' }]),
    ).toEqual([{ lang: 'TypeScript', description: 'Install for TypeScript' }])
  })

  it('drops entries with an empty description', () => {
    expect(getRenderableSdks([{ lang: 'TypeScript', description: '' }])).toEqual([])
  })
})
