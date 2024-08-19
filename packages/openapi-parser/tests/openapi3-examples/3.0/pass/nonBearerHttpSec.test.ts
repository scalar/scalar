import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/pass/${filename}`

describe('nonBearerHttpSec', () => {
  it('passes', async () => {
    const nonBearerHttpSec = await downloadFileToMemory(
      bucketName,
      filePath('nonBearerHttpSec.yaml'),
    )
    const result = await validate(nonBearerHttpSec)

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})
