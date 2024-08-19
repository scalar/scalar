import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('serverVariableEnumType', () => {
  it('returns an error', async () => {
    const serverVariableEnumType = await downloadFileToMemory(
      bucketName,
      filePath('serverVariableEnumType.yaml'),
    )
    const result = await validate(serverVariableEnumType)

    // TODO: Swagger Editor has a better error message
    //
    // Structural error at servers.0.variables.version.enum.1 should be string
    expect(result.errors?.[0]?.message).toBe(`type must be string`)
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
