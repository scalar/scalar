import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src/index'
import openApiUi from './openapi-ui.yaml?raw'

describe('openapi-ui', () => {
  it('apiWithExamples', async () => {
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
