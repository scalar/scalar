import { describe, expect, it } from 'vitest'

import { normalize } from '@/utils/normalize'
import { resolveReferences } from '@/utils/resolve-references'

import specification from './specification.json'

// Circular $refs to ancestor
describe.todo('ancestor', () => {
  it('relative path', () => {
    const schema = resolveReferences(normalize(specification))

    expect(schema).not.toBe(undefined)
  })

  it('absolute path', () => {
    //
  })

  it('URL', () => {
    //
  })
})
