import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.1/fail/${filename}`

describe('no_containers', () => {
  it('returns an error', async () => {
    const no_containers = await downloadFileToMemory(
      bucketName,
      filePath('no_containers.yaml'),
    )
    const result = await validate(no_containers)

    // TODO: Fix the expected error message should mention 'paths'
    expect(result.errors?.[0]?.message).toBe(
      `must have required property 'webhooks'`,
    )
    expect(result.valid).toBe(false)
  })
})
