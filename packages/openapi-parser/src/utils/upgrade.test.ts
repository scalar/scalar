import { describe, expect, it } from 'vitest'

import { makeFilesystem } from './make-filesystem'
import { upgrade } from './upgrade'

describe('upgrade', () => {
  it('upgrades documents from Swagger 2.0 to OpenAPI 3.1', () => {
    const { specification } = upgrade({
      swagger: '2.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(specification.swagger).toBeUndefined()
    expect(specification.openapi).toBe('3.1.1')
  })

  it('changes the version to from 3.0.0 to 3.1.0', () => {
    const { specification } = upgrade({
      openapi: '3.0.0',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(specification.openapi).toBe('3.1.1')
  })

  it('changes the version to 3.0.3 to 3.1.0', () => {
    const { specification } = upgrade({
      openapi: '3.0.3',
      info: {
        title: 'Hello World',
        version: '1.0.0',
      },
      paths: {},
    })

    expect(specification.openapi).toBe('3.1.1')
  })

  it('works with a filesystem', () => {
    const { specification } = upgrade(
      makeFilesystem({
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      }),
    )

    expect(specification.openapi).toBe('3.1.1')
  })

  it('deals with null', () => {
    const { specification } = upgrade(null)

    expect(specification).toStrictEqual(null)
  })
})
