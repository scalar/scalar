import { describe, expect, it } from 'vitest'

import specification from './specification.json'
import { resolveReferences } from '@/utils/resolve-references'
import { normalize } from '@/utils/normalize'

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
