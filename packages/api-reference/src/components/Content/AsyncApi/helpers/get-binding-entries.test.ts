import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas'
import { describe, expect, it } from 'vitest'

import { getBindingEntries } from './get-binding-entries'

/** Load real store proxies so references behave as they do in the reference UI. */
const loadDocument = async (value: Record<string, unknown>): Promise<Record<string, unknown>> => {
  const store = createWorkspaceStore()
  await store.addDocument({
    name: 'bindings',
    document: { asyncapi: '3.1.0', info: { title: 'Bindings', version: '1.0' }, ...value },
  })
  const document = store.workspace.documents.bindings
  if (!document) throw new Error('Expected a loaded document')
  return document
}

const fields = (value: unknown): Record<string, unknown> =>
  Object.fromEntries(
    getBindingEntries(value).flatMap((entry) => entry.fields.map((field) => [field.name, JSON.parse(field.content)])),
  )

describe('get-binding-entries', () => {
  it.each([undefined, null, {}, 'invalid', []])('omits missing or invalid maps: %j', (value) => {
    expect(getBindingEntries(value)).toStrictEqual([])
  })

  it('retains versions, unfamiliar protocols and fields, empty bindings, and falsy values', () => {
    expect(
      getBindingEntries({
        future: { bindingVersion: '9.0', enabled: false, count: 0, note: '', extra: null },
        mqtt: {},
      }),
    ).toStrictEqual([
      {
        name: 'future',
        fields: [
          { name: 'bindingVersion', content: '"9.0"', nested: false },
          { name: 'enabled', content: 'false', nested: false },
          { name: 'count', content: '0', nested: false },
          { name: 'note', content: '""', nested: false },
          { name: 'extra', content: 'null', nested: false },
        ],
      },
      { name: 'mqtt', fields: [] },
    ])
  })

  it('resolves maps and nested schema references without leaking store metadata or mutating input', async () => {
    const original = {
      bindings: { $ref: '#/shared' },
      shared: { kafka: { bindingVersion: '0.5.0', key: { $ref: '#/key' } } },
      key: { type: 'string', enum: ['order-id'] },
    }
    const document = await loadDocument(original)
    const before = structuredClone(original)
    expect(fields(document.bindings)).toStrictEqual({
      bindingVersion: '0.5.0',
      key: { type: 'string', enum: ['order-id'] },
    })
    expect(original).toStrictEqual(before)
  })

  it('keeps literal references and metadata-named fields inside schema data and extensions', async () => {
    const value = { $ref: '#/key', '$status': 'authored' }
    const document = await loadDocument({
      bindings: {
        kafka: {
          key: { type: 'object', properties: { $ref: { type: 'string' } }, default: value },
          'x-custom': value,
        },
      },
      key: { type: 'number' },
    })
    expect(fields(document.bindings)).toStrictEqual({
      key: { type: 'object', properties: { $ref: { type: 'string' } }, default: value },
      'x-custom': value,
    })
  })

  it('keeps unresolved and cyclic reference pointers readable', async () => {
    expect(getBindingEntries({ $ref: '#/missing' })).toStrictEqual([
      { name: 'Reference', fields: [{ name: '$ref', content: '"#/missing"', nested: false }] },
    ])
    const document = await loadDocument({ bindings: { $ref: '#/loop' }, loop: { $ref: '#/bindings' } })
    expect(getBindingEntries(document.bindings)).toStrictEqual([
      { name: 'Reference', fields: [{ name: '$ref', content: '"#/loop"', nested: false }] },
    ])
  })

  it('renders recursive schemas without infinite expansion', async () => {
    const document = await loadDocument({
      bindings: { kafka: { key: { $ref: '#/key' } } },
      key: { type: 'object', properties: { child: { $ref: '#/key' } } },
    })
    expect(fields(document.bindings)).toStrictEqual({ key: { type: 'object', properties: { child: '[Circular]' } } })
  })

  it('loads external binding references through the workspace loader', async () => {
    const bindings = { kafka: { bindingVersion: '0.5.0', key: { type: 'string' } } }
    const store = createWorkspaceStore({
      fileLoader: {
        type: 'loader',
        validate: (url) => url === 'memory:bindings',
        exec: () => Promise.resolve({ ok: true, data: bindings, raw: JSON.stringify(bindings) }),
      },
    })
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi: '3.1.0',
        info: { title: 'Events', version: '1.0' },
        channels: { events: { messages: { event: { bindings: { $ref: 'memory:bindings' } } } } },
      },
    })
    const document = store.workspace.documents.events
    if (!document || !isAsyncApiDocument(document)) throw new Error('Expected AsyncAPI')
    const message = getResolvedRef(getResolvedRef(document.channels?.events)?.messages?.event)
    expect(getBindingEntries(message?.bindings)).toStrictEqual(getBindingEntries(bindings))
  })

  it.each(['2.6.0', '3.1.0'])('preserves unfamiliar binding data through the %s loader', async (asyncapi) => {
    const store = createWorkspaceStore()
    const bindings = {
      kafka: { bindingVersion: '0.5.0', extra: { flags: [false, 0] } },
      future: { vendor: 'example' },
      ws: { 'x-unknown': 'kept' },
    }
    await store.addDocument({
      name: 'events',
      document: {
        asyncapi,
        info: { title: 'Events', version: '1.0' },
        channels: { events: { bindings: { $ref: '#/components/channelBindings/common' } } },
        components: { channelBindings: { common: bindings } },
      },
    })
    const document = store.workspace.documents.events
    if (!document || !isAsyncApiDocument(document)) throw new Error('Expected AsyncAPI')
    expect(getBindingEntries(getResolvedRef(document.channels?.events)?.bindings)).toStrictEqual(
      getBindingEntries(bindings),
    )
  })
})
