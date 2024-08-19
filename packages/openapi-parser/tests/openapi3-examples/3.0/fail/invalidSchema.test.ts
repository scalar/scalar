import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('invalidSchema', () => {
  it('returns an error', async () => {
    const invalidSchema = await downloadFileToMemory(
      bucketName,
      filePath('invalidSchema.json'),
    )
    const result = await validate(invalidSchema)

    // TODO: Swagger Editor
    //
    // Resolver error at paths./test.$ref
    // Could not resolve reference: undefined undefined
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
