import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('incorrectSecType', () => {
  it('returns an error', async () => {
    const incorrectSecType = await downloadFileToMemory(
      bucketName,
      filePath('incorrectSecType.json'),
    )
    const result = await validate(incorrectSecType)

    // TODO: Shouldn’t this metnion the incorrect security type?
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
