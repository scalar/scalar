import { describe, expect, it } from 'vitest'

import { normalize, resolveReferences } from '../../../src/index.ts'
import specification from './specification.json'

// Circular $refs to ancestor
describe.todo('ancestor', () => {
  it('relative path', async () => {
    const schema = resolveReferences(normalize(specification))

    expect(schema).not.toBe(undefined)
  })

  it('absolute path', async () => {
    //
  })

  it('URL', async () => {
    //
  })
})
