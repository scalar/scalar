import type { UnknownObject } from '@scalar/types/utils'
import { describe, expect, it } from 'vitest'

import { upgrade } from './upgrade'

describe('upgrade', () => {
  it('upgrades documents from Swagger 2.0 to OpenAPI 3.1', () => {
    const document = upgrade(
      {
        swagger: '2.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      },
      '3.1',
    )

    expect(document?.swagger).toBeUndefined()
    expect(document?.openapi).toBe('3.1.1')
  })

  it('changes the version to from 3.0.0 to 3.1.0', () => {
    const document = upgrade(
      {
        openapi: '3.0.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      },
      '3.1',
    )

    expect(document?.openapi).toBe('3.1.1')
  })

  it('changes the version to 3.0.3 to 3.1.0', () => {
    const document = upgrade(
      {
        openapi: '3.0.3',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      },
      '3.1',
    )

    expect(document?.openapi).toBe('3.1.1')
  })

  it('deals with null', () => {
    const document = upgrade(null as unknown as UnknownObject, '3.1')

    expect(document).toStrictEqual(null)
  })
  it.each([{ swagger: '2.0' }, { openapi: '3.0.4' }, { openapi: '3.1.2' }])(
    'upgrades %j through the public 3.2 pipeline without mutating input',
    (version) => {
      const input = { ...version, info: { title: 'API', version: '1' }, paths: {} }
      const before = structuredClone(input)
      expect(upgrade(input, '3.2')).toStrictEqual({ openapi: '3.2.0', info: input.info, paths: {} })
      expect(input).toStrictEqual(before)
    },
  )

  it('applies XML and tag migrations through the public API', () => {
    const input = {
      openapi: '3.1.2',
      info: { title: 'API', version: '1' },
      paths: {},
      components: {
        schemas: { Books: { type: 'array', items: { type: 'string' }, xml: { wrapped: true, attribute: false } } },
      },
      'x-tagGroups': [{ name: 'Accounts', tags: ['users'] }],
    }
    const before = structuredClone(input)
    expect(upgrade(input, '3.2')).toStrictEqual({
      ...input,
      openapi: '3.2.0',
      components: { schemas: { Books: { type: 'array', items: { type: 'string' }, xml: { nodeType: 'element' } } } },
      tags: [
        { name: 'Accounts', kind: 'nav' },
        { name: 'users', parent: 'Accounts' },
      ],
    })
    expect(input).toStrictEqual(before)
  })

  it('preserves 3.0 input when the final upgrade step fails', () => {
    const input = {
      openapi: '3.0.4',
      info: { title: 'API', version: '1' },
      paths: {},
      servers: [{ url: 'https://{host}/{host}', variables: { host: { default: 'api' } } }],
    }
    const before = structuredClone(input)
    expect(() => upgrade(input, '3.2')).toThrow('#/servers/0/url')
    expect(input).toStrictEqual(before)
  })

  it('preserves existing 3.2 features and literal values', () => {
    const input = {
      openapi: '3.2.0',
      info: { title: 'API', version: '1' },
      paths: {},
      'x-custom': { xml: { wrapped: true, attribute: true } },
    }
    expect(upgrade(input, '3.2')).toStrictEqual(input)
  })
})
