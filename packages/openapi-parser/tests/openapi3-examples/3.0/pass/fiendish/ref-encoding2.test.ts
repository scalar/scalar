import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src'
import { downloadFileToMemory } from '../../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) =>
  `openapi3-examples/3.0/pass/fiendish/${filename}`

describe('ref-encoding2', () => {
  it('passes', async () => {
    const refEncoding2 = await downloadFileToMemory(
      bucketName,
      filePath('ref-encoding2.yaml'),
    )
    const result = await validate(refEncoding2)

    expect(result.errors).toStrictEqual([])
    expect(result.valid).toBe(true)
    expect(result.version).toBe('2.0')
  })
})
