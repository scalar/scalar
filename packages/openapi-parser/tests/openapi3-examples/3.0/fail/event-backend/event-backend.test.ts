import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src'
import { downloadFileToMemory } from '../../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) =>
  `openapi3-examples/3.0/fail/event-backend/${filename}`

describe('event-backend', () => {
  it('openapi1', async () => {
    const openapi1 = await downloadFileToMemory(
      bucketName,
      filePath('openapi1.json'),
    )

    const result = await validate(openapi1)

    // TODO: What does that mean?
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.valid).toBe(false)
  })

  it('openapi2', async () => {
    const openapi2 = await downloadFileToMemory(
      bucketName,
      filePath('openapi2.json'),
    )
    const result = await validate(openapi2)

    // TODO: What does that mean?
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.valid).toBe(false)
  })

  it('openapi3', async () => {
    const openapi3 = await downloadFileToMemory(
      bucketName,
      filePath('openapi3.json'),
    )
    const result = await validate(openapi3)

    // TODO: What does that mean?
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.valid).toBe(false)
  })
})
