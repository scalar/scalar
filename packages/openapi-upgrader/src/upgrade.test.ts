import type { UnknownObject } from '@scalar/types/utils'
import { describe, expect, it } from 'vitest'

import { upgrade } from './upgrade'

describe('upgrade', () => {
  it('upgrades documents from Swagger 2.0 to OpenAPI 3.1', async () => {
    const document = upgrade({
      swagger: '2.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(document?.swagger).toBeUndefined()
    expect(document?.openapi).toBe('3.1.1')
  })

  it('changes the version to from 3.0.0 to 3.1.0', async () => {
    const document = upgrade({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(document?.openapi).toBe('3.1.1')
  })

  it('changes the version to 3.0.3 to 3.1.0', async () => {
    const document = upgrade({
      openapi: '3.0.3',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(document?.openapi).toBe('3.1.1')
  })

  it('deals with null', async () => {
    const document = upgrade(null as unknown as UnknownObject)

    expect(document).toStrictEqual(null)
  })
})
