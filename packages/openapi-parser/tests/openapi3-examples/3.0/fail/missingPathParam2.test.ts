import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe.todo('missingPathParam2', () => {
  it('returns an error', async () => {
    const missingPathParam2 = await downloadFileToMemory(
      bucketName,
      filePath('missingPathParam2.yaml'),
    )
    const result = await validate(missingPathParam2)

    // TODO: Swagger Editor
    //
    // Semantic error at paths./test/{test}/{test2}
    // Declared path parameter "test2" needs to be defined as a path parameter at either the path or operation level
    expect(result.errors?.[0]?.message).toBe(`something something test2`)
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
