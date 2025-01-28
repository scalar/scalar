import { describe, expect, it } from 'vitest'

import { Validator } from './Validator.ts'

describe('Validator', () => {
  it('returns all supported versions', () => {
    expect(Validator.supportedVersions).toMatchObject(['2.0', '3.0', '3.1'])
  })
})
