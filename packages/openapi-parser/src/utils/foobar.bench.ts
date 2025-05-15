import { bench, describe, expect } from 'vitest'

import { upgrade as upgradeOld } from './slow/upgrade'
import { upgrade } from './upgrade'

// Setup the test data
const EXAMPLE_DOCUMENT = await fetch(
  'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json',
).then((r) => r.json())

describe('upgrade', () => {
  bench('new', () => {
    expect(EXAMPLE_DOCUMENT.openapi).toBe('3.0.0')

    const { specification } = upgrade(JSON.stringify(EXAMPLE_DOCUMENT))

    expect(specification?.openapi).toBe('3.1.1')
  })

  bench('old', () => {
    expect(EXAMPLE_DOCUMENT.openapi).toBe('3.0.0')

    const { specification } = upgradeOld(JSON.stringify(EXAMPLE_DOCUMENT))

    expect(specification?.openapi).toBe('3.1.1')
  })
})
