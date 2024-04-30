import { describe, expect, it } from 'vitest'

import galaxy from '../src/specifications/3.1.yaml?raw'

describe('yaml', () => {
  it('has OpenAPI version', () => {
    expect(galaxy).toContain('openapi: 3.1.0')
  })
})
