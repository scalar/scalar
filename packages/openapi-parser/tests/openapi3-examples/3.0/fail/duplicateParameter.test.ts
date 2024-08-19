import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe.todo('duplicateParameter', () => {
  it('returns an error', async () => {
    const duplicateParameter = await downloadFileToMemory(
      bucketName,
      filePath('duplicateParameter.yaml'),
    )
    const result = await validate(duplicateParameter)

    expect(result.errors?.[0]?.message).toBe(
      `something something duplicate parameter`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
