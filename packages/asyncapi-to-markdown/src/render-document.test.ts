import { describe, expect, it } from 'vitest'

import { createAsyncApiMarkdownRenderer, createMarkdownFromAsyncApi } from './index'

const shared = {
  asyncapi: '3.1.0',
  info: { title: 'Shared events', version: '1' },
  channels: { events: { address: 'events', messages: { event: { $ref: '#/components/messages/Event' } } } },
  operations: Object.fromEntries(
    ['first', 'second', 'third'].map((name) => [
      name,
      {
        action: 'receive',
        channel: { $ref: '#/channels/events' },
        tags: [{ name: name === 'third' ? 'Other' : 'Events' }],
      },
    ]),
  ),
  components: {
    messages: { Event: { payload: { $ref: '#/components/schemas/Event' } } },
    schemas: {
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'UniqueFieldDescription' },
          details: { $ref: '#/components/schemas/Details' },
        },
      },
      Details: { type: 'object', properties: { count: { type: 'integer' } } },
      Unused: { type: 'string', description: 'Unused model description' },
    },
  },
}

describe('render-document', () => {
  it('renders shared structured schemas once and links every use', async () => {
    const result = await createMarkdownFromAsyncApi(shared)
    expect(result.split('UniqueFieldDescription').length - 1).toBe(1)
    expect(result).toContain('[Event](#scalar-model-event)')
    expect(result.split('<a id="scalar-model-event"></a>').length - 1).toBe(1)
    expect(result).toContain('## Contents')
    const anchors = [...result.matchAll(/<a id="([^"]+)"><\/a>/g)].map((match) => match[1])
    expect(new Set(anchors).size).toBe(anchors.length)
    for (const match of result.matchAll(/\]\(#([^)]*)\)/g)) {
      expect(anchors.includes(match[1])).toBe(true)
    }
  })

  it('does not truncate a frequently reused model', async () => {
    const result = await createMarkdownFromAsyncApi({
      ...shared,
      operations: Object.fromEntries(
        Array.from({ length: 60 }, (_, index) => [`receive${index}`, shared.operations.first]),
      ),
      components: {
        ...shared.components,
        schemas: {
          Event: {
            type: 'object',
            properties: Object.fromEntries(
              Array.from({ length: 100 }, (_, index) => [
                `field${index}`,
                { type: 'string', description: `Description${index}` },
              ]),
            ),
          },
        },
      },
    })
    expect(result).not.toContain('Schema expansion limit reached')
    expect(result.split('Description99').length - 1).toBe(1)
  })

  it('includes only transitive dependencies on selected pages', async () => {
    const result = await createMarkdownFromAsyncApi(shared, { operation: 'first' })
    expect(result).toContain('UniqueFieldDescription')
    expect(result).toContain('Schema: Details')
    expect(result).not.toContain('Unused model description')
  })

  it('supports published model URLs and omits the dependency appendix in linked mode', async () => {
    const result = await createMarkdownFromAsyncApi(shared, {
      operation: 'first',
      schemaReferences: { mode: 'linked', resolveUrl: ({ name }) => `/models/${name}` },
    })
    expect(result).toContain('UniqueFieldDescription')
    expect(result).toContain('[Details](/models/Details)')
    expect(result).not.toContain('Schema: Details')
    expect(result).not.toContain('Generated example')
    const plain = await createMarkdownFromAsyncApi(shared, { model: 'Event', schemaReferences: { mode: 'linked' } })
    expect(plain).toContain('Details')
    expect(plain).not.toContain('#scalar-model-details')
  })

  it('allows callers to link primitive references', async () => {
    const input = {
      ...shared,
      components: {
        ...shared.components,
        schemas: {
          ...shared.components.schemas,
          Event: { type: 'object', properties: { value: { $ref: '#/components/schemas/Unused' } } },
        },
      },
    }
    const renderer = await createAsyncApiMarkdownRenderer(input)
    expect(await renderer.render({ model: 'Event', schemaReferences: { mode: 'linked' } })).toContain(
      'Unused model description',
    )
    expect(
      await renderer.render({
        model: 'Event',
        schemaReferences: { mode: 'linked', inlinePrimitives: false, resolveUrl: ({ name }) => `/models/${name}` },
      }),
    ).toContain('[Unused](/models/Unused)')
  })

  it('selects tagged operations without including unrelated operations', async () => {
    const result = await createMarkdownFromAsyncApi(shared, { tag: 'Events' })
    expect(result).toContain('# Events')
    expect(result).toContain('## first')
    expect(result).toContain('## second')
    expect(result).not.toContain('## third')
    await expect(createMarkdownFromAsyncApi(shared, { tag: 'Missing' })).rejects.toThrow('Unknown tag: Missing')
  })

  it('labels generated examples and links repeated generation', async () => {
    const result = await createMarkdownFromAsyncApi(shared)
    expect(result.split('**Generated example:**').length - 1).toBe(2)
    expect(result).toContain('[Generated example](#scalar-example-1)')
  })

  it('preserves authored message examples instead of generating replacements', async () => {
    const input = {
      ...shared,
      components: {
        ...shared.components,
        messages: { Event: { ...shared.components.messages.Event, examples: [{ payload: { id: 'authored' } }] } },
      },
    }
    const result = await createMarkdownFromAsyncApi(input, { message: 'Event' })
    expect(result).toContain('"id": "authored"')
    expect(result).not.toContain('Generated example')
  })

  it('rejects malformed pointer escapes', async () => {
    await expect(
      createMarkdownFromAsyncApi(
        { ...shared, channels: { 'bad~2': {} } },
        { channel: { pointer: '#/channels/bad~2' } },
      ),
    ).rejects.toThrow('Invalid JSON pointer escape')
  })

  it('keeps repeated and concurrent renders isolated', async () => {
    const renderer = await createAsyncApiMarkdownRenderer(shared)
    const expected = await renderer.render()
    const results = await Promise.all([renderer.render(), renderer.render({ tag: 'Events' }), renderer.render()])
    expect(results[0]).toBe(expected)
    expect(results[2]).toBe(expected)
  })
  it('preserves every authored schema example at repeated linked payload usages', async () => {
    const input = {
      asyncapi: '3.1.0',
      info: { title: 'Examples', version: '1' },
      channels: {
        events: {
          messages: {
            first: { payload: { $ref: '#/components/schemas/Child' } },
            second: { payload: { $ref: '#/components/schemas/Child' } },
          },
        },
      },
      components: { schemas: { Child: { type: 'object', examples: [{ id: 'AUTHORED' }, { id: 'SECOND' }] } } },
    }
    for (const options of [
      { channel: 'events' },
      { channel: 'events', schemaReferences: { mode: 'linked' } },
    ] as const) {
      const result = await createMarkdownFromAsyncApi(input, options)
      expect(result.split('"id": "AUTHORED"').length - 1).toBe(2)
      expect(result.split('"id": "SECOND"').length - 1).toBe(2)
      expect(result).not.toContain('Generated example')
    }
  })

  it('links structured enum and const references even when primitive inlining is enabled', async () => {
    for (const child of [{ type: 'object', enum: [{ id: 'A' }] }, { enum: [['A']] }, { const: { id: 'A' } }]) {
      const result = await createMarkdownFromAsyncApi(
        {
          asyncapi: '3.1.0',
          info: { title: 'Structured values', version: '1' },
          components: {
            schemas: {
              Parent: { type: 'object', properties: { child: { $ref: '#/components/schemas/Child' } } },
              Child: child,
            },
          },
        },
        { model: 'Parent', schemaReferences: { mode: 'linked', resolveUrl: ({ name }) => `/models/${name}` } },
      )
      expect(result).toContain('[Child](/models/Child)')
      expect(result).not.toContain('"A"')
    }
  })
})
