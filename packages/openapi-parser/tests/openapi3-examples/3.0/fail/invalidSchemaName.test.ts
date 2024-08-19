import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('invalidSchemaName', () => {
  it('returns an error', async () => {
    const invalidSchemaName = await downloadFileToMemory(
      bucketName,
      filePath('invalidSchemaName.json'),
    )
    const result = await validate(invalidSchemaName)

    // TODO: Swagger Editor
    //
    // * Could not resolve reference: undefined undefined
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
