import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.1/pass/${filename}`

describe('minimal_hooks', () => {
  it('passes', async () => {
    const minimal_hooks = await downloadFileToMemory(
      bucketName,
      filePath('minimal_hooks.yaml'),
    )
    const result = await validate(minimal_hooks)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})
