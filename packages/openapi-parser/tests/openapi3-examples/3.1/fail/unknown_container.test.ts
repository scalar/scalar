import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import unknown_container from './unknown_container.yaml?raw'

describe('unknown_container', () => {
  it('returns an error', async () => {
    const result = await validate(unknown_container)

    // TODO: The message should complain about the unknown container
    expect(result.errors?.[0]?.message).toBe(
      `must have required property 'webhooks'`,
    )
    expect(result.valid).toBe(false)
  })
})
