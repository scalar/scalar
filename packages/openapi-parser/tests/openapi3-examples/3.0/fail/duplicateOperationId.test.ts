import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe.todo('duplicateOperationId', () => {
  it('returns an error', async () => {
    const duplicateOperationId = await downloadFileToMemory(
      bucketName,
      filePath('duplicateOperationId.yaml'),
    )
    const result = await validate(duplicateOperationId)

    expect(result.errors?.[0]?.message).toBe(
      `something something duplicate operationId`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
