import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.1/pass/${filename}`

describe('info_summary', () => {
  it('passes', async () => {
    const info_summary = await downloadFileToMemory(
      bucketName,
      filePath('info_summary.yaml'),
    )
    const result = await validate(info_summary)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})
