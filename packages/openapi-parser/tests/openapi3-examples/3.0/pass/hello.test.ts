import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/pass/${filename}`

describe('hello', () => {
  it('passes', async () => {
    const hello = await downloadFileToMemory(bucketName, filePath('hello.yaml'))
    const result = await validate(hello)

    expect(result.errors?.length).toBe(0)
    expect(result.version).toBe('3.0')
  })
})
