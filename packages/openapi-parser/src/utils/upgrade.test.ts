import { describe, expect, it } from 'vitest'

import type { AnyObject } from '../types'
import { upgrade } from './upgrade'

describe('upgrade', () => {
  it('doesn’t modify Swagger 2.0 files', async () => {
    const { specification } = upgrade({
      swagger: '2.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }) as AnyObject

    expect(specification.swagger).toBe('2.0')
  })

  it('changes the version to from 3.0.0 to 3.1.0', async () => {
    const { specification } = upgrade({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }) as AnyObject

    expect(specification.openapi).toBe('3.1.0')
  })

  it('changes the version to 3.0.3 to 3.1.0', async () => {
    const { specification } = upgrade({
      openapi: '3.0.3',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    }) as AnyObject

    expect(specification.openapi).toBe('3.1.0')
  })
})
