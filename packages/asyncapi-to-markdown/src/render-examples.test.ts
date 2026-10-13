import { describe, expect, it } from 'vitest'

import { createMarkdownFromAsyncApi } from './index'

const input = { asyncapi: '3.1.0', info: { title: 'Examples', version: '1' } }

describe('render-examples', () => {
  it('stubs linked structured dependencies in a selected model example', async () => {
    const result = await createMarkdownFromAsyncApi(
      {
        ...input,
        components: {
          schemas: {
            Event: { type: 'object', properties: { details: { $ref: '#/components/schemas/Details' } } },
            Details: { type: 'object', properties: { secret: { const: 'nested-value' } } },
          },
        },
      },
      { model: 'Event', schemaReferences: { mode: 'linked' } },
    )
    expect(result).toContain('**Generated example:**')
    expect(result).not.toContain('nested-value')
  })

  it('bounds dense recursive example graphs before generation', async () => {
    const result = await createMarkdownFromAsyncApi(
      {
        ...input,
        components: {
          messages: { Event: { payload: { $ref: '#/components/schemas/Event' } } },
          schemas: {
            Event: {
              type: 'object',
              properties: Object.fromEntries(
                Array.from({ length: 10 }, (_, index) => [`child${index}`, { $ref: '#/components/schemas/Event' }]),
              ),
            },
          },
        },
      },
      { message: 'Event' },
    )
    expect(result).toContain('Generated example omitted because it is too large.')
    expect(result).not.toContain('```json')
  })

  it('does not generate payloads for non-JSON schema formats', async () => {
    const result = await createMarkdownFromAsyncApi(
      {
        ...input,
        components: {
          messages: {
            Event: {
              payload: {
                schemaFormat: 'application/vnd.apache.avro+json;version=1.9.0',
                schema: { type: 'record', name: 'Event', fields: [] },
              },
            },
          },
        },
      },
      { message: 'Event' },
    )
    expect(result).toContain('Schema format:')
    expect(result).not.toContain('Generated example')
  })
  it('generates allowed values for primitive aliases wrapped in compositions', async () => {
    const result = await createMarkdownFromAsyncApi(
      {
        ...input,
        components: {
          schemas: {
            Choice: { allOf: [{ type: 'string', enum: ['a', 'b'] }] },
            Constant: { allOf: [{ const: 'fixed' }] },
            Event: {
              type: 'object',
              properties: {
                choice: { $ref: '#/components/schemas/Choice' },
                constant: { $ref: '#/components/schemas/Constant' },
              },
            },
          },
        },
      },
      { model: 'Event', schemaReferences: { mode: 'linked' } },
    )
    const example = /```json\n([\s\S]*?)\n```/.exec(result)
    expect(JSON.parse(example![1]!)).toStrictEqual({ choice: 'a', constant: 'fixed' })
  })
  it.each(['default', 'deprecated', 'readOnly', 'writeOnly'] as const)(
    'keeps primitive aliases inline with a %s annotation',
    async (annotation) => {
      const result = await createMarkdownFromAsyncApi(
        {
          ...input,
          components: {
            schemas: {
              Alias: {
                allOf: [{ type: 'string', enum: ['hello'] }],
                [annotation]: annotation === 'default' ? 'hello' : true,
              },
              Event: { type: 'object', properties: { value: { $ref: '#/components/schemas/Alias' } } },
            },
          },
        },
        { model: 'Event', schemaReferences: { mode: 'linked', resolveUrl: ({ name }) => `/models/${name}` } },
      )
      expect(result).toContain('**`value`**: `string`')
      expect(result).not.toContain('[Alias](')
      const example = /```json\n([\s\S]*?)\n```/.exec(result)
      // The shared generator omits deprecated properties in both converters.
      expect(JSON.parse(example![1]!)).toStrictEqual(annotation === 'deprecated' ? {} : { value: 'hello' })
      expect(result).toContain(`${annotation}:`)
    },
  )

  it.each([false, true])('renders every schema-authored XML example with linked mode %s', async (linked) => {
    const result = await createMarkdownFromAsyncApi(
      {
        ...input,
        defaultContentType: 'application/xml',
        channels: {
          events: {
            address: 'events',
            messages: {
              first: { $ref: '#/components/messages/Event' },
              second: { $ref: '#/components/messages/Event' },
            },
          },
        },
        components: {
          messages: {
            Event: {
              headers: { type: 'object', examples: [{ token: 'header' }] },
              payload: { $ref: '#/components/schemas/Data' },
            },
          },
          schemas: {
            Data: {
              type: 'object',
              properties: { id: { type: 'string' } },
              examples: [{ id: 'first' }, { id: 'second' }],
            },
          },
        },
      },
      { channel: 'events', ...(linked ? { schemaReferences: { mode: 'linked' as const } } : {}) },
    )
    expect(result.split('<id>first</id>').length - 1).toBe(2)
    expect(result.split('<id>second</id>').length - 1).toBe(2)
    expect(result.split('```xml').length - 1).toBe(4)
    expect(result).toContain('"token": "header"')
    expect(result).not.toContain('"id": "first"')
  })
  it('stubs primitive and structured references when primitive inlining is disabled', async () => {
    const result = await createMarkdownFromAsyncApi(
      {
        ...input,
        components: {
          schemas: {
            Alias: { type: 'string', enum: ['ok'] },
            Child: { type: 'object', properties: { id: { type: 'string' } } },
            Event: {
              type: 'object',
              properties: {
                value: { $ref: '#/components/schemas/Alias' },
                child: { $ref: '#/components/schemas/Child' },
              },
            },
          },
        },
      },
      { model: 'Event', schemaReferences: { mode: 'linked', inlinePrimitives: false } },
    )
    const example = /```json\n([\s\S]*?)\n```/.exec(result)
    expect(JSON.parse(example![1]!)).toStrictEqual({ value: {}, child: {} })
  })
})
