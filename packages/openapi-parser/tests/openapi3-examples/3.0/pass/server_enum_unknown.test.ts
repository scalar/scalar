import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/pass/${filename}`

describe.todo('server_enum_unknown', () => {
  it('passes', async () => {
    const server_enum_unknown = await downloadFileToMemory(
      bucketName,
      filePath('server_enum_unknown.yaml'),
    )
    const result = await validate(server_enum_unknown)

    expect(result.valid).toBe(false)
    expect(result.errors?.length).toBe(1)
    expect(result.errors?.[0]?.message).toBe(
      'should be equal to one of the allowed values',
    )
  })
})
