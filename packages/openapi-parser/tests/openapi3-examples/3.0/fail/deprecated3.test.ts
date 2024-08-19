import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe.todo('deprecated3', () => {
  it('returns an error', async () => {
    const deprecated3 = await downloadFileToMemory(
      bucketName,
      filePath('deprecated3.yaml'),
    )
    const result = await validate(deprecated3)

    expect(result.errors?.[0]?.message).toBe(`something something deprecated`)
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
