import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import no_containers from './no_containers.yaml?raw'

describe('no_containers', () => {
  it('returns an error', async () => {
    const result = await validate(no_containers)

    expect(result.errors?.[0]?.message).toBe(`must have required property 'paths'`)
    expect(result.errors?.[1]?.message).toBe(`must have required property 'components'`)
    expect(result.errors?.[2]?.message).toBe(`must have required property 'webhooks'`)

    expect(result.valid).toBe(false)
  })
})
