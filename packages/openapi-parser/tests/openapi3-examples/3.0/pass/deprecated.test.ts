import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/pass/${filename}`

describe('deprecated', () => {
  it('passes', async () => {
    const deprecated = await downloadFileToMemory(
      bucketName,
      filePath('deprecated.yaml'),
    )
    const result = await validate(deprecated)

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})
