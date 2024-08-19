import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src'
import { downloadFileToMemory } from '../../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) =>
  `openapi3-examples/3.0/pass/fiendish/${filename}`

describe('ref-encoding3', () => {
  it('passes', async () => {
    const refEncoding3 = await downloadFileToMemory(
      bucketName,
      filePath('ref-encoding3.yaml'),
    )
    const result = await validate(refEncoding3)

    expect(result.errors).toStrictEqual([])
    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})
