import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe.todo('missingPathParam', () => {
  it('returns an error', async () => {
    const missingPathParam = await downloadFileToMemory(
      bucketName,
      filePath('missingPathParam.yaml'),
    )
    const result = await validate(missingPathParam)

    // TODO: Swagger Editor
    //
    // * Declared path parameter "test2" needs to be defined as a path parameter at either the path or operation level
    // * Path parameter "test" must have the corresponding {test} segment in the "/test/{test2}" path
    expect(result.errors?.[0]?.message).toBe(`something something test`)
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
