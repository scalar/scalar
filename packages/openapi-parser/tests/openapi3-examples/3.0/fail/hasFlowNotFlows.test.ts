import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import hasFlowNotFlows from './hasFlowNotFlows.json'

describe('hasFlowNotFlows', () => {
  it('returns an error', () => {
    const result = validate(hasFlowNotFlows)

    // TODO: This should probably mention the incorrect security type?
    expect(result.errors?.[0]?.message).toBe(`must have required property '$ref'`)
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
