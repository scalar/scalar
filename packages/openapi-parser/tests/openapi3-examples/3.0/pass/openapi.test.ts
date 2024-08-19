import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/pass/${filename}`

describe('openapi', () => {
  it('passes', async () => {
    const openapi = await downloadFileToMemory(
      bucketName,
      filePath('openapi.yaml'),
    )
    const result = await validate(openapi)

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})
