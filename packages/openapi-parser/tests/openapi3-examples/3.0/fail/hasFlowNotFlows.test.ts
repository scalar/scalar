import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import hasFlowNotFlows from './hasFlowNotFlows.json'

describe('hasFlowNotFlows', () => {
  it('returns an error', async () => {
    const result = await validate(hasFlowNotFlows)

    // Thanks to the discriminator on the SecurityScheme oneOf (using the "type" property),
    // AJV knows to validate against OAuth2SecurityScheme and gives us a specific error.
    expect(result.errors?.[0]?.message).toBe('Property flow is not expected to be here')
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
