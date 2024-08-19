import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('pathitem-property', () => {
  it('returns an error', async () => {
    const pathitemProperty = await downloadFileToMemory(
      bucketName,
      filePath('pathitem-property.yaml'),
    )
    const result = await validate(pathitemProperty)

    expect(result.errors?.[0]?.message).toBe(
      `Property GET is not expected to be here`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
