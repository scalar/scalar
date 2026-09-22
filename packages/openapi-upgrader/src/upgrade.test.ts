import type { UnknownObject } from '@scalar/types/utils'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { type UpgradeOptions, type UpgradeResult, upgrade } from './upgrade'
import { UpgradeIncompatibilityError } from './upgrade-incompatibility-error'

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

  it.each(['3.0', '3.1'] as const)('does not apply 3.2 parameter migration when targeting %s', (target) => {
    const input = {
      openapi: '3.1.2',
      info: { title: 'API', version: '1' },
      paths: {},
      components: { parameters: { Id: { name: 'id', in: 'path', allowReserved: true } } },
    }
    const before = structuredClone(input)
    expect(target === '3.0' ? upgrade(input, '3.0') : upgrade(input, '3.1')).toStrictEqual(before)
    expect(input).toStrictEqual(before)
  })

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

  it.each(['3.1', '3.1.0-rc1'])('reports malformed version %s through the public API', (openapi) => {
    const input = { openapi, info: { title: 'API', version: '1' }, paths: {} }
    expect(() => upgrade(input, '3.2')).toThrow(`invalid OpenAPI version "${openapi}"`)
    expect(input.openapi).toBe(openapi)
  })

  it('reports alias expansion limits without modifying the caller document', () => {
    const leaf = Array.from({ length: 2000 }, () => 'x')
    const input = { openapi: '3.1.0', 'x-aliases': Array.from({ length: 1001 }, () => leaf) }
    expect(() => upgrade(input, '3.2')).toThrow('excessive YAML alias expansion')
    expect(input.openapi).toBe('3.1.0')
    expect(input['x-aliases'][0]).toBe(leaf)
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

  it.each([{ swagger: '2.0' }, { openapi: '3.0.4' }, { openapi: '3.1.2' }, { openapi: '3.2.0' }])(
    'collects no diagnostics for compatible input %j',
    (version) => {
      const input = { ...version, info: { title: 'API', version: '1' }, paths: {} }
      const original = structuredClone(input)
      const result = upgrade(input, '3.2', { onIncompatible: 'collect' })
      expect(result).toStrictEqual({
        document: { openapi: '3.2.0', info: input.info, paths: {} },
        diagnostics: [],
      })
      expect(result.document).not.toBe(input)
      expect(input).toStrictEqual(original)
      expectTypeOf(result).toEqualTypeOf<UpgradeResult>()
    },
  )

  it.each(['3.0.4', '3.1.2'])('retains complete 3.1 semantics and all diagnostics for %s', (openapi) => {
    const input = {
      openapi,
      info: { title: 'API', version: '1' },
      paths: {},
      servers: [{ url: 'https://{host}/{host}', variables: { host: { default: 'api' } } }],
      components: {
        parameters: { Id: { name: 'id', in: 'path', allowReserved: true } },
        schemas: {
          Attribute: { type: 'string', xml: { attribute: true } },
          Pet: { type: 'object', discriminator: { propertyName: 'kind' } },
        },
      },
      'x-tagGroups': [{ name: 'Accounts', tags: ['users'] }],
    }
    const original = structuredClone(input)
    const result = upgrade(input, '3.2', { onIncompatible: 'collect' })
    expect(result.document).toStrictEqual({ ...original, openapi: openapi === '3.0.4' ? '3.1.1' : openapi })
    expect(result.diagnostics.map((error) => error.message).sort()).toStrictEqual([
      'Cannot upgrade to OpenAPI 3.2 at #/components/schemas/Pet/discriminator: An optional discriminating property needs an explicit defaultMapping.',
      'Cannot upgrade to OpenAPI 3.2 at #/servers/0/url: Template variables must not be repeated. Rename the repeated variable and define it separately.',
    ])
    result.document.info.title = 'Changed'
    expect(input).toStrictEqual(original)
  })

  it('collects unnamed XML diagnostics without relabeling the description as 3.2', () => {
    const input = {
      openapi: '3.1.2',
      info: { title: 'API', version: '1' },
      paths: {},
      components: {
        responses: { Xml: { description: 'OK', content: { 'application/xml': { schema: { type: 'object' } } } } },
      },
    }
    expect(upgrade(input, '3.2', { onIncompatible: 'collect' })).toStrictEqual({
      document: input,
      diagnostics: [
        new Error(
          'Cannot upgrade to OpenAPI 3.2 at #/components/responses/Xml/content/application~1xml/schema: An inline XML element needs an explicit xml.name.',
        ),
      ],
    })
    expect(() => upgrade(input, '3.2')).toThrow(UpgradeIncompatibilityError)
    expect(() => upgrade(input, '3.2', { onIncompatible: 'throw' })).toThrow(UpgradeIncompatibilityError)
  })

  it.each(['3.1', '3.1.0-rc1'])('propagates malformed version %s in collect mode', (openapi) => {
    expect(() => upgrade({ openapi }, '3.2', { onIncompatible: 'collect' })).toThrow(
      `invalid OpenAPI version "${openapi}"`,
    )
  })

  it('propagates clone safety errors in collect mode', () => {
    const cyclic: UnknownObject = { openapi: '3.1.2' }
    cyclic.self = cyclic
    expect(() => upgrade(cyclic, '3.2', { onIncompatible: 'collect' })).toThrow('cyclic objects')
    const shared = Array.from({ length: 2000 }, () => 'x')
    const input = { openapi: '3.1.2', 'x-aliases': Array.from({ length: 1001 }, () => shared) }
    expect(() => upgrade(input, '3.2', { onIncompatible: 'collect' })).toThrow('excessive YAML alias expansion')
  })

  it('accepts a mode chosen at runtime', () => {
    const input = { openapi: '3.1.2', info: { title: 'API', version: '1' }, paths: {} }
    const run = (options: UpgradeOptions): ReturnType<typeof upgrade> => upgrade(input, '3.2', options)
    expect(run({ onIncompatible: 'collect' })).toStrictEqual({
      document: { ...input, openapi: '3.2.0' },
      diagnostics: [],
    })
    expect(run({ onIncompatible: 'throw' })).toStrictEqual({ ...input, openapi: '3.2.0' })
  })
})
