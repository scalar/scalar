import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.1/pass/${filename}`

describe('license_identifier', () => {
  it('passes', async () => {
    const license_identifier = await downloadFileToMemory(
      bucketName,
      filePath('license_identifier.yaml'),
    )
    const result = await validate(license_identifier)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})
