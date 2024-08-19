import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe.todo('missingPathItemRef', () => {
  it('returns an error', async () => {
    const missingPathItemRef = await downloadFileToMemory(
      bucketName,
      filePath('missingPathItemRef.yaml'),
    )
    const result = await validate(missingPathItemRef)

    // TODO: Swagger Editor
    //
    // * Resolver error at paths./test.$ref
    // Could not resolve reference: undefined undefined
    expect(result.errors?.[0]?.message).toBe(`something something test`)
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
