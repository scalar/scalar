import type { OpenAPIV3_2 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

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

  it('preserves group names, order, and tags shared by multiple groups', () => {
    const input = {
      openapi: '3.1.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {},
      tags: [{ name: 'pets' }, { name: 'users' }],
      'x-tagGroups': [
        { name: 'Store', tags: ['users', 'pets'] },
        { name: 'Administration', tags: ['users'] },
      ],
    }
    const expected = { ...structuredClone(input), openapi: '3.2.0' }

    expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual(expected)
  })

  it.each(['Navigation', 'Audience', 'Badge'])('preserves tag metadata in the %s group', (name) => {
    const input = {
      openapi: '3.1.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {},
      tags: [
        { name: 'pets', description: 'Pet operations', 'x-displayName': 'Pets', kind: 'custom' },
        { name: 'users' },
      ],
      'x-tagGroups': [{ name, tags: ['pets', 'users'] }],
    }
    const expected = { ...structuredClone(input), openapi: '3.2.0' }

    expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual(expected)
  })

  it('preserves groups when tags are only declared on operations', () => {
    const input = {
      openapi: '3.1.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {
        '/pets': {
          get: { tags: ['pets'], responses: { '200': { description: 'OK' } } },
        },
      },
      'x-tagGroups': [{ name: 'Store', tags: ['pets'] }],
    }
    const expected = { ...structuredClone(input), openapi: '3.2.0' }

    expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual(expected)
  })

  it.each([{}, { 'x-tagGroups': [] }])('preserves absent or empty groups: %j', (groups) => {
    const input = {
      openapi: '3.1.0',
      info: { title: 'API', version: '1.0.0' },
      paths: {},
      tags: [{ name: 'pets' }],
      ...groups,
    }
    const expected = { ...structuredClone(input), openapi: '3.2.0' }

    expect(upgradeFromThreeOneToThreeTwo(input)).toStrictEqual(expected)
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
