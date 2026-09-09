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

    expect((specification as Record<string, unknown>).swagger).toBeUndefined()
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

  it.each(['2.0', '3.0.0', '3.1.0', '3.2.0'])('reports the resulting version when upgrading %s', (sourceVersion) => {
    const input = {
      ...(sourceVersion === '2.0' ? { swagger: sourceVersion } : { openapi: sourceVersion }),
      info: { title: 'Version test', version: '1.0.0' },
      paths: {},
    }
    const result = upgrade(input)

    expect(result.version).toBe(sourceVersion === '3.2.0' ? '3.2' : '3.1')
    expect(result.specification.openapi).toBe(
      sourceVersion === '3.2.0' || sourceVersion === '3.1.0' ? sourceVersion : '3.1.1',
    )
  })

  it('does not invent a version for empty or unsupported input', () => {
    expect(upgrade(null)).toStrictEqual({ specification: null, version: undefined })
    expect(upgrade({ openapi: '4.0.0' })).toStrictEqual({
      specification: { openapi: '4.0.0' },
      version: undefined,
    })
  })
})
