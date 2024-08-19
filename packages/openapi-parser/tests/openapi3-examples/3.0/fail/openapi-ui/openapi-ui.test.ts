import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src'
import { downloadFileToMemory } from '../../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) =>
  `openapi3-examples/3.0/fail/openapi-ui/${filename}`

describe('openapi-ui', () => {
  it('apiWithExamples', async () => {
    const openApiUi = await downloadFileToMemory(
      bucketName,
      filePath('openapi-ui.yaml'),
    )

    const result = await validate(openApiUi)

    // TODO: SwaggerUI has a more helpful error message:
    //
    // Structural error at paths./project/{projectUUID}/invite/.get.responses.200
    // should NOT have additional properties
    // additionalProperty: schema
    // …
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.valid).toBe(false)
  })
})
