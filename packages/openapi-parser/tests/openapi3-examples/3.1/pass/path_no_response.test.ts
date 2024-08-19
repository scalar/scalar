import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.1/pass/${filename}`

describe('path_no_response', () => {
  it('passes', async () => {
    const path_no_response = await downloadFileToMemory(
      bucketName,
      filePath('path_no_response.yaml'),
    )
    const result = await validate(path_no_response)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})
