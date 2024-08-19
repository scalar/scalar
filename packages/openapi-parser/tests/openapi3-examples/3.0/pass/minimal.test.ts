import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/pass/${filename}`

describe('minimal', () => {
  it('passes', async () => {
    const minimal = await downloadFileToMemory(
      bucketName,
      filePath('minimal.yaml'),
    )
    const result = await validate(minimal)

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})
