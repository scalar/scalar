import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe.todo('deprecated2', () => {
  it('returns an error', async () => {
    const deprecated2 = await downloadFileToMemory(
      bucketName,
      filePath('deprecated2.yaml'),
    )
    const result = await validate(deprecated2)

    expect(result.errors?.[0]?.message).toBe(`something something deprecated`)
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
