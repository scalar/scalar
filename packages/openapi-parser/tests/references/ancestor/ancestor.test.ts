import { describe, expect, it } from 'vitest'

import { normalize, resolveReferences } from '../../../src'
import { downloadFileToMemory } from '../../utils/downloadFileGcp'

const bucketName = 'test-specifications'

// Circular $refs to ancestor
describe.todo('ancestor', () => {
  it('relative path', async () => {
    const specification = await downloadFileToMemory(
      bucketName,
      'references/ancestor-reference.json',
    )

    console.log('DOWNLOADED SPEC', specification)

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
