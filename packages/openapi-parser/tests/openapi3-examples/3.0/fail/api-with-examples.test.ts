import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import { downloadFileToMemory } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/fail/${filename}`

describe('api-with-examples', () => {
  it('returns an error', async () => {
    const apiWithExamples = await downloadFileToMemory(
      bucketName,
      filePath('api-with-examples.yaml'),
    )

    const result = await validate(apiWithExamples)

    // TODO: Swagger Editor:
    //
    // Structural error at paths./.get.responses.200.content.application/json.examples
    // should be object
    // …
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
