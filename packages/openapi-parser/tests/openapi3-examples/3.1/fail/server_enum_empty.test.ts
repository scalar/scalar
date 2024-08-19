import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.1/fail/${filename}`

describe('server_enum_empty', () => {
  it('returns an error', async () => {
    const server_enum_empty = await downloadFileToMemory(
      bucketName,
      filePath('server_enum_empty.yaml'),
    )
    const result = await validate(server_enum_empty)

    // TODO: The error should return something related to the empty enum
    expect(result.errors?.[0]?.message).toBe(
      `format must match format "uri-reference"`,
    )
    expect(result.valid).toBe(false)
  })
})
