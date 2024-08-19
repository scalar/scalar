import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('license_identifier', () => {
  it('returns an error', async () => {
    const license_identifier = await downloadFileToMemory(
      bucketName,
      filePath('license_identifier.yaml'),
    )
    const result = await validate(license_identifier)

    // TODO: Swagger Editor
    //
    // Structural error at info.license
    // should NOT have additional properties
    // additionalProperty: identifier
    expect(result.errors?.[0]?.message).toBe(
      `Property identifier is not expected to be here`,
    )
    expect(result.valid).toBe(false)
  })
})
