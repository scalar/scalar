import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('deprecated', () => {
  it('returns an error', async () => {
    const deprecated = await downloadFileToMemory(
      bucketName,
      filePath('deprecated.yaml'),
    )
    const result = await validate(deprecated)

    expect(result.errors?.[0]?.message).toBe(`type must be boolean`)
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
