import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/pass/${filename}`

describe.todo('server_enum_empty', () => {
  it('passes', async () => {
    const server_enum_empty = await downloadFileToMemory(
      bucketName,
      filePath('server_enum_empty.yaml'),
    )
    const result = await validate(server_enum_empty)

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})
