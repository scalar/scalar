import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/pass/${filename}`

describe('extensionsEverywhere', () => {
  it('passes', async () => {
    const extensionsEverywhere = await downloadFileToMemory(
      bucketName,
      filePath('extensionsEverywhere.yaml'),
    )
    const result = await validate(extensionsEverywhere)

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})
