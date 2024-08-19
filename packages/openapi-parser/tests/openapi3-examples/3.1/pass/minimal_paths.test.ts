import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.1/pass/${filename}`

describe('minimal_paths', () => {
  it('passes', async () => {
    const minimal_paths = await downloadFileToMemory(
      bucketName,
      filePath('minimal_paths.yaml'),
    )
    const result = await validate(minimal_paths)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})
