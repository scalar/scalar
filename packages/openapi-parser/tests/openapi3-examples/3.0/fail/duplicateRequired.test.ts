import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe.todo('duplicateRequired', () => {
  it('returns an error', async () => {
    const duplicateRequired = await downloadFileToMemory(
      bucketName,
      filePath('duplicateRequired.yaml'),
    )
    const result = await validate(duplicateRequired)

    expect(result.errors?.[0]?.message).toBe(
      `something something duplicate required properties`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
