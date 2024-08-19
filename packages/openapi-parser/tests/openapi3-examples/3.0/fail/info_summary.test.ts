import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('info_summary', () => {
  it('returns an error', async () => {
    const info_summary = await downloadFileToMemory(
      bucketName,
      filePath('info_summary.yaml'),
    )

    const result = await validate(info_summary)

    expect(result.errors?.[0]?.message).toBe(
      'Property summary is not expected to be here',
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
