import { describe, expect, it } from 'vitest'

import specification from './specification.json'
import { resolveReferences } from '@/utils/resolve-references'
import { normalize } from '@/utils/normalize'

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
