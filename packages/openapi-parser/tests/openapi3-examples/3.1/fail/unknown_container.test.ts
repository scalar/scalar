import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.1/fail/${filename}`

describe('unknown_container', () => {
  it('returns an error', async () => {
    const unknown_container = await downloadFileToMemory(
      bucketName,
      filePath('unknown_container.yaml'),
    )
    const result = await validate(unknown_container)

    // TODO: The message should complain about the unknown container
    expect(result.errors?.[0]?.message).toBe(
      `must have required property 'webhooks'`,
    )
    expect(result.valid).toBe(false)
  })
})
