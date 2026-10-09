import { describe, expect, it, vi } from 'vitest'

import { createWorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { isOpenApiDocument } from '@/schemas'

const documentWithExamples = (count: number): Record<string, unknown> => ({
  openapi: '3.1.0',
  info: { title: 'External examples', version: '1' },
  paths: {
    '/shipments': {
      post: {
        requestBody: {
          content: {
            'application/json': {
              examples: Object.fromEntries(
                Array.from({ length: count }, (_, index) => [
                  `example-${index}`,
                  { externalValue: `https://example.com/examples/${index}` },
                ]),
              ),
            },
          },
        },
        responses: {},
      },
    },
  },
})

describe('external-examples.integration', () => {
  it.each([1200, 12000])('imports %i external examples without downloading any payloads', async (count) => {
    const fetch = vi.fn(async () => new Response('{"shippingType":"standard"}'))
    const store = createWorkspaceStore({ fetch })
    await store.addDocument({ name: 'shipping', document: documentWithExamples(count) })
    expect(fetch.mock.calls.length).toBe(0)
    await store.resolve(['paths', '/shipments', 'post'])
    expect(fetch.mock.calls.length).toBe(0)
    const state = store.externalExamples('shipping')({ externalValue: 'https://example.com/examples/0' })
    await state.load()
    expect(fetch.mock.calls.length).toBe(1)
    expect(state.value).toEqual({ shippingType: 'standard' })
    await store.externalExamples('shipping')({ externalValue: 'https://example.com/examples/0' }).load()
    expect(fetch.mock.calls.length).toBe(1)
  })

  it('uses the referenced document origin and the per-document transport', async () => {
    const respond = (value: unknown): Promise<Response> => Promise.resolve(Response.json(value))
    const fetch = vi.fn((input: string | URL | Request) => {
      const url = String(input)
      if (url.endsWith('/openapi.json'))
        return respond({
          ...documentWithExamples(0),
          paths: { '/shipments': { $ref: './operations/shipping.json' } },
        })
      if (url.endsWith('/shipping.json'))
        return respond({
          post: {
            requestBody: {
              content: {
                'application/json': {
                  examples: {
                    standard: { externalValue: '../payloads/standard.json' },
                  },
                },
              },
            },
            responses: {},
          },
        })
      return respond({ shippingType: 'standard' })
    })
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'shipping', url: 'https://example.com/docs/openapi.json', fetch })
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
      'https://example.com/docs/openapi.json',
      'https://example.com/docs/operations/shipping.json',
    ])
    const document = store.workspace.documents.shipping
    if (!isOpenApiDocument(document)) throw new Error('Expected OpenAPI document')
    const operation = getResolvedRef(getResolvedRef(document.paths?.['/shipments'])?.post)
    const example = getResolvedRef(
      getResolvedRef(operation?.requestBody)?.content['application/json']?.examples?.standard,
    )
    expect(example).toEqual({ externalValue: 'https://example.com/docs/payloads/standard.json' })
    if (!example) throw new Error('Expected example')
    const state = store.externalExamples('shipping')(example)
    await state.load()
    expect(state.value).toEqual({ shippingType: 'standard' })
    expect(example.value).toBeUndefined()
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
      'https://example.com/docs/openapi.json',
      'https://example.com/docs/operations/shipping.json',
      'https://example.com/docs/payloads/standard.json',
    ])
  })

  it('invalidates cached payloads when the document is replaced', async () => {
    const fetch = vi.fn(async () => Response.json({ version: fetch.mock.calls.length }))
    const store = createWorkspaceStore({ fetch })
    await store.addDocument({ name: 'shipping', document: documentWithExamples(1) })
    const example = { externalValue: 'https://example.com/examples/0' }
    const first = store.externalExamples('shipping')(example)
    await first.load()
    await store.addDocument({ name: 'shipping', document: documentWithExamples(1) })
    const second = store.externalExamples('shipping')(example)
    expect(second.status).toBe('idle')
    await second.load()
    expect(second.value).toEqual({ version: 2 })
    expect(first.value).toEqual({ version: 1 })
  })
  it('keeps referenced examples lazy and does not interpret payload fields as examples', async () => {
    const fetch = vi.fn((input: string | URL | Request) =>
      Promise.resolve(
        Response.json(
          String(input).endsWith('/definition.json')
            ? { externalValue: './payload.json' }
            : { shippingType: 'standard' },
        ),
      ),
    )
    const store = createWorkspaceStore({ fetch })
    const document = documentWithExamples(0)
    document.components = {
      examples: {
        remote: { $ref: 'https://example.com/examples/definition.json' },
        inline: { value: { externalValue: './business-field' } },
      },
    }
    await store.addDocument({ name: 'shipping', document })
    const stored = store.workspace.documents.shipping
    if (!isOpenApiDocument(stored)) throw new Error('Expected OpenAPI document')
    const remote = getResolvedRef(stored.components?.examples?.remote)
    expect(remote).toEqual({ externalValue: 'https://example.com/examples/payload.json' })
    expect(getResolvedRef(stored.components?.examples?.inline)?.value).toEqual({ externalValue: './business-field' })
    expect(fetch.mock.calls.length).toBe(1)
    if (!remote) throw new Error('Expected example')
    await store.externalExamples('shipping')(remote).load()
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual([
      'https://example.com/examples/definition.json',
      'https://example.com/examples/payload.json',
    ])
  })
})
