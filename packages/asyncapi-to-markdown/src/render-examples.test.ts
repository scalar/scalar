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
})
