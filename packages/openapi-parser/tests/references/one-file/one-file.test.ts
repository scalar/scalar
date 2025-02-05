import { describe, expect, it } from 'vitest'

import { normalize, resolveReferences } from '../../../src/index.ts'
import specification from './specification.json'

// Single-file schema with internal $refs
describe.todo('one-file', () => {
  it('relative path', async () => {
    const schema = resolveReferences(normalize(specification))

    expect(schema).not.toBe(undefined)
    // TODO: Expectation
  })

  it('absolute path', async () => {
    //
  })

  it('URL', async () => {
    //
  })
})
