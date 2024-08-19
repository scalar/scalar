import { Storage } from '@google-cloud/storage'
import { describe, expect, it } from 'vitest'

import { normalize, resolveReferences } from '../../../src'
import { downloadFileToMemory } from '../../utils/downloadFileGcp'

const bucketName = 'test-specifications'

// Single-file schema with internal $refs
describe.todo('one-file', () => {
  it('relative path', async () => {
    const specification = downloadFileToMemory(
      bucketName,
      'references/one-file-reference.json',
    )

    console.log('DOWNLOADED SPEC', specification)

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
