import { describe, expect, it } from 'vitest'

import { normalize } from '@/utils/normalize'
import { resolveReferences } from '@/utils/resolve-references'

import specification from './specification.json'

// Single-file schema with internal $refs
describe.todo('one-file', () => {
  it('relative path', () => {
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
