import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src/index'
import openApiUi from './openapi-ui.yaml?raw'

describe('openapi-ui', () => {
  it('apiWithExamples', async () => {
    const result = await validate(openApiUi)

    //
    // Structural error at paths./project/{projectUUID}/invite/.get.responses.200
    // should NOT have additional properties
    // additionalProperty: schema

    // There are 24 total errors in this response
    expect(result.errors?.[0]?.message).toBe('Property schema is not expected to be here')
    expect(result.valid).toBe(false)
  })
})
