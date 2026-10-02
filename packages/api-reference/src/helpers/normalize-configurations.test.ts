import { describe, expect, it } from 'vitest'

import { normalizeConfigurations } from './normalize-configurations'

describe('normalize-configurations', () => {
  it.each([false, true])('preserves hideModelNames=%s through configuration normalization', (hideModelNames) => {
    const configurations = normalizeConfigurations({ url: '/openapi.json', hideModelNames })
    expect(Object.values(configurations)[0]?.config.hideModelNames).toBe(hideModelNames)
  })
})
