import type { OpenAPIV3_2 } from '@scalar/openapi-types'
import { describe, expect, it, vi } from 'vitest'

import { upgradeFromThreeOneToThreeTwo } from '@/3.1-to-3.2/upgrade-from-three-one-to-three-two'

describe('upgradeFromThreeOneToThreeTwo', () => {
  describe('version', () => {
    it(`doesn't modify Swagger 2.0 files`, () => {
      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo({
        swagger: '2.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.swagger).toBe('2.0')
    })

    it('changes the version to from 3.1.0 to 3.2.0', () => {
      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo({
        openapi: '3.1.0',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.openapi).toBe('3.2.0')
    })

    it('changes the version to 3.1.1 to 3.2.0', () => {
      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo({
        openapi: '3.1.1',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        paths: {},
      })

      expect(result.openapi).toBe('3.2.0')
    })
  })

  it('migrates group names and member order to parent tags and removes x-tagGroups', () => {
    const input = {
      openapi: '3.1.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {},
      tags: [{ name: 'pets', description: 'Pet operations' }, { name: 'users' }, { name: 'other' }],
      'x-tagGroups': [
        { name: 'Store', tags: ['users', 'pets'] },
        { name: 'Administration', tags: ['admins'] },
      ],
    }

    expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual({
      openapi: '3.2.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {},
      tags: [
        { name: 'Store', kind: 'nav' },
        { name: 'users', parent: 'Store' },
        { name: 'pets', description: 'Pet operations', parent: 'Store' },
        { name: 'Administration', kind: 'nav' },
        { name: 'admins', parent: 'Administration' },
        { name: 'other' },
      ],
    })
  })

  it.each(['Navigation', 'Audience', 'Badge'])('does not infer tag kinds from the %s group name', (name) => {
    const input = {
      openapi: '3.1.0',
      tags: [{ name: 'pets', description: 'Pet operations', 'x-displayName': 'Pets', kind: 'custom' }],
      'x-tagGroups': [{ name, tags: ['pets'] }],
    }

    expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual({
      openapi: '3.2.0',
      tags: [
        { name, kind: 'nav' },
        { name: 'pets', description: 'Pet operations', 'x-displayName': 'Pets', kind: 'custom', parent: name },
      ],
    })
  })

  it('declares tags that were only used on operations without changing operation tags', () => {
    const paths = { '/pets': { get: { tags: ['pets'], responses: { '200': { description: 'OK' } } } } }
    const input = { openapi: '3.1.0', paths, 'x-tagGroups': [{ name: 'Store', tags: ['pets'] }] }

    expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual({
      openapi: '3.2.0',
      paths,
      tags: [
        { name: 'Store', kind: 'nav' },
        { name: 'pets', parent: 'Store' },
      ],
    })
  })

  it.each([undefined, [{ name: 'Pets', description: 'Pet operations' }]])(
    'gives a group that shares a member name a unique name and preserves its label: %j',
    (tags) => {
      const input = {
        openapi: '3.1.0',
        ...(tags ? { tags } : {}),
        'x-tagGroups': [{ name: 'Pets', tags: ['Pets'] }],
      }
      const result = upgradeFromThreeOneToThreeTwo(input)

      expect(result).toStrictEqual({
        openapi: '3.2.0',
        tags: [
          { name: 'Pets-group', summary: 'Pets', kind: 'nav' },
          { ...(tags?.[0] ?? {}), name: 'Pets', parent: 'Pets-group' },
        ],
      })
      expect(upgradeFromThreeOneToThreeTwo(result)).toStrictEqual(result)
    },
  )

  it('reserves declared, undeclared, and future group names when choosing a suffix', () => {
    const paths = { '/pets': { get: { tags: ['Pets-group-2'], responses: { '200': { description: 'OK' } } } } }
    const input = {
      openapi: '3.1.0',
      paths,
      tags: [{ name: 'Pets' }, { name: 'Pets-group' }],
      'x-tagGroups': [
        { name: 'Pets', tags: ['Pets'] },
        { name: 'Pets-group-3', tags: ['users'] },
      ],
    }
    const repeated = structuredClone(input)
    const result = upgradeFromThreeOneToThreeTwo(input)

    expect(result).toStrictEqual({
      openapi: '3.2.0',
      paths,
      tags: [
        { name: 'Pets-group-4', summary: 'Pets', kind: 'nav' },
        { name: 'Pets', parent: 'Pets-group-4' },
        { name: 'Pets-group-3', kind: 'nav' },
        { name: 'users', parent: 'Pets-group-3' },
        { name: 'Pets-group' },
      ],
    })
    expect(upgradeFromThreeOneToThreeTwo(repeated)).toStrictEqual(result)
  })

  it('avoids collisions with operation-only tags in webhooks, callbacks, and reusable path items', () => {
    const operation = (tag: string): Record<string, unknown> => ({
      tags: [tag],
      responses: { '200': { description: 'OK' } },
    })
    const webhooks = { event: { post: operation('Pets') } }
    const components = {
      pathItems: { pets: { get: operation('Pets-group') } },
      callbacks: { event: { '{$request.body#/url}': { post: operation('Pets-group-2') } } },
    }

    expect(
      upgradeFromThreeOneToThreeTwo({
        openapi: '3.1.0',
        webhooks,
        components,
        'x-tagGroups': [{ name: 'Pets', tags: ['cats'] }],
      }),
    ).toStrictEqual({
      openapi: '3.2.0',
      webhooks,
      components,
      tags: [
        { name: 'Pets-group-3', summary: 'Pets', kind: 'nav' },
        { name: 'cats', parent: 'Pets-group-3' },
      ],
    })
  })

  it('keeps generated group names unique when multiple groups collide', () => {
    expect(
      upgradeFromThreeOneToThreeTwo({
        openapi: '3.1.0',
        'x-tagGroups': [
          { name: 'Pets', tags: ['Pets'] },
          { name: 'Pets-group', tags: ['Pets-group'] },
        ],
      }).tags,
    ).toStrictEqual([
      { name: 'Pets-group-2', summary: 'Pets', kind: 'nav' },
      { name: 'Pets', parent: 'Pets-group-2' },
      { name: 'Pets-group-group', summary: 'Pets-group', kind: 'nav' },
      { name: 'Pets-group', parent: 'Pets-group-group' },
    ])
  })

  it('removes empty x-tagGroups without adding a tags array', () => {
    expect(upgradeFromThreeOneToThreeTwo({ openapi: '3.1.0', 'x-tagGroups': [] })).toStrictEqual({
      openapi: '3.2.0',
    })
  })

  it('leaves tags unchanged when there are no groups', () => {
    expect(upgradeFromThreeOneToThreeTwo({ openapi: '3.1.0', tags: [{ name: 'pets' }] })).toStrictEqual({
      openapi: '3.2.0',
      tags: [{ name: 'pets' }],
    })
  })

  it.each([
    {
      tags: [],
      'x-tagGroups': [
        { name: 'Store', tags: ['pets'] },
        { name: 'Admin', tags: ['pets'] },
      ],
    },
    { tags: [{ name: 'pets', parent: 'Other' }], 'x-tagGroups': [{ name: 'Store', tags: ['pets'] }] },
    { tags: [], 'x-tagGroups': [{ name: 'Store', tags: [42] }] },
    { tags: [], 'x-tagGroups': null },
    { tags: {}, 'x-tagGroups': [] },
    { tags: [{ name: 'pets' }, { name: 'pets' }], 'x-tagGroups': [{ name: 'Store', tags: ['pets'] }] },
    { tags: [null], 'x-tagGroups': [] },
    { 'x-tagGroups': [null] },
  ])('preserves ambiguous or invalid groups while upgrading: %j', (groups) => {
    const input = { openapi: '3.1.0', ...groups }
    const original = structuredClone(input)

    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual({ ...original, openapi: '3.2.0' })
      expect(warning).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('Cannot migrate x-tagGroups:'))
      expect(input).toStrictEqual(original)
    } finally {
      warning.mockRestore()
    }
  })

  it('treats prototype property names as ordinary tag names', () => {
    const input = JSON.parse(
      '{"openapi":"3.1.0","__proto__":{"tags":["__proto__-group"]},"x-tagGroups":[{"name":"__proto__","tags":["__proto__","constructor","prototype"]}]}',
    )
    const original = structuredClone(input)
    const prototype = Object.getOwnPropertyDescriptors(Object.prototype)

    const result = upgradeFromThreeOneToThreeTwo(input)

    expect(result.tags).toStrictEqual([
      { name: '__proto__-group-2', summary: '__proto__', kind: 'nav' },
      { name: '__proto__', parent: '__proto__-group-2' },
      { name: 'constructor', parent: '__proto__-group-2' },
      { name: 'prototype', parent: '__proto__-group-2' },
    ])
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(Object.getOwnPropertyNames(Object.prototype)).toStrictEqual(Object.keys(prototype))
    for (const [name, descriptor] of Object.entries(prototype)) {
      const current = Object.getOwnPropertyDescriptor(Object.prototype, name)
      expect(current?.value).toBe(descriptor.value)
      expect(current?.get).toBe(descriptor.get)
      expect(current?.set).toBe(descriptor.set)
    }
    expect(input).toStrictEqual(original)
  })

  it('does not modify a prototype reached through an untrusted document name', () => {
    const prototype = { openapi: '3.1.0', 'x-tagGroups': [{ name: 'Store', tags: ['pets'] }] }
    const documents = Object.create(prototype)
    const original = structuredClone(prototype)

    expect(upgradeFromThreeOneToThreeTwo(documents['__proto__'])).toStrictEqual({
      openapi: '3.2.0',
      tags: [
        { name: 'Store', kind: 'nav' },
        { name: 'pets', parent: 'Store' },
      ],
    })
    expect(prototype).toStrictEqual(original)
  })

  it('merges repeated groups and repeated membership without duplicating tags', () => {
    expect(
      upgradeFromThreeOneToThreeTwo({
        openapi: '3.1.0',
        'x-tagGroups': [
          { name: 'Store', tags: ['pets', 'pets'] },
          { name: 'Store', tags: ['users'] },
        ],
      }),
    ).toStrictEqual({
      openapi: '3.2.0',
      tags: [
        { name: 'Store', kind: 'nav' },
        { name: 'pets', parent: 'Store' },
        { name: 'users', parent: 'Store' },
      ],
    })
  })

  describe('xmlNode attribute and element migration', () => {
    it('migrates xmlNode attribute from wrapped to element', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            SampleSchema: {
              type: 'object',
              properties: {
                sampleProperty: {
                  type: 'string',
                  xml: { wrapped: true },
                },
              },
            },
          },
        },
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result.components?.schemas?.SampleSchema).toBeDefined()
      expect(result.components?.schemas?.SampleSchema).toMatchObject({
        type: 'object',
        properties: {
          sampleProperty: {
            type: 'string',
            xml: { nodeType: 'element' },
          },
        },
      } as OpenAPIV3_2.SchemaObject)
    })

    it('migrates xmlNode attribute from attribute to attribute type', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            SampleSchema: {
              type: 'object',
              properties: {
                sampleProperty: {
                  type: 'string',
                  xml: { attribute: true },
                },
              },
            },
          },
        },
      }

      const result: OpenAPIV3_2.Document = upgradeFromThreeOneToThreeTwo(input)

      expect(result.openapi).toBe('3.2.0')
      expect(result.components?.schemas?.SampleSchema).toBeDefined()
      expect(result.components?.schemas?.SampleSchema).toMatchObject({
        type: 'object',
        properties: {
          sampleProperty: {
            type: 'string',
            xml: { nodeType: 'attribute' },
          },
        },
      } as OpenAPIV3_2.SchemaObject)
    })

    it('throws an error when both fields are true', () => {
      const input = {
        openapi: '3.1.0',
        info: {
          title: 'API',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            SampleSchema: {
              type: 'object',
              properties: {
                sampleProperty: {
                  type: 'string',
                  xml: { wrapped: true, attribute: true },
                },
              },
            },
          },
        },
      }

      expect(() => upgradeFromThreeOneToThreeTwo(input)).toThrowError(
        'Invalid XML configuration: wrapped and attribute cannot be true at the same time.',
      )
    })
  })
})
