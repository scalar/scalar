import type { UnknownObject } from '@scalar/types/utils'
import { describe, expect, it } from 'vitest'

import { upgrade } from './upgrade'

describe('upgrade', () => {
  it('upgrades an AsyncAPI 1.x document to 3.1.0', () => {
    const document = upgrade({ asyncapi: '1.2.0', info: {} })

    expect(document.asyncapi).toBe('3.1.0')
  })

  it('upgrades an AsyncAPI 2.x document to 3.1.0', () => {
    const document = upgrade({ asyncapi: '2.6.0', info: {} })

    expect(document.asyncapi).toBe('3.1.0')
  })

  it('upgrades an AsyncAPI 3.0 document to 3.1.0', () => {
    const document = upgrade({ asyncapi: '3.0.0', info: {} })

    expect(document.asyncapi).toBe('3.1.0')
  })

  it('leaves documents without an asyncapi field untouched', () => {
    const document = { openapi: '3.1.0' }

    expect(upgrade(document)).toBe(document)
  })

  it('deals with null', () => {
    expect(upgrade(null as unknown as UnknownObject)).toStrictEqual(null)
  })
})
