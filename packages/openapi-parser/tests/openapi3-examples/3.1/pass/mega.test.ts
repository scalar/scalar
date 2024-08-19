import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.1/pass/${filename}`

describe('mega', () => {
  it('passes', async () => {
    const mega = await downloadFileToMemory(bucketName, filePath('mega.yaml'))
    const result = await validate(mega)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})
