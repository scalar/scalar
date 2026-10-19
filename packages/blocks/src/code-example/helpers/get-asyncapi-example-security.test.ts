import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { describe, expect, it } from 'vitest'

import { getAsyncApiExampleContext } from './get-asyncapi-example-context'
import { getAsyncApiExampleSecurity } from './get-asyncapi-example-security'

const setup = async (): Promise<{ document: AsyncApiDocument; store: WorkspaceStore }> => {
  const store = createWorkspaceStore()
  await store.addDocument({
    name: 'events',
    document: {
      asyncapi: '3.1.0',
      info: { title: 'Events', version: '1' },
      servers: {
        first: {
          host: 'one.example.com',
          protocol: 'wss',
          security: [
            { $ref: '#/components/securitySchemes/query' },
            { $ref: '#/components/securitySchemes/cookie' },
            { $ref: '#/components/securitySchemes/bearer' },
          ],
        },
        second: { host: 'two.example.com', protocol: 'wss' },
      },
      channels: { events: { address: '/events' } },
      operations: {
        receive: {
          action: 'receive',
          channel: { $ref: '#/channels/events' },
          security: [{ $ref: '#/components/securitySchemes/operation' }],
        },
      },
      components: {
        securitySchemes: {
          query: { type: 'httpApiKey', in: 'query', name: 'api_key' },
          cookie: { type: 'httpApiKey', in: 'cookie', name: 'session' },
          bearer: { type: 'http', scheme: 'bearer' },
          operation: { type: 'httpApiKey', in: 'query', name: 'operation_key' },
        },
      },
    },
  })
  const document = store.workspace.activeDocument
  if (!isAsyncApiDocument(document)) {
    throw new Error('Expected AsyncAPI')
  }
  store.auth.setAuthSecrets('events', 'query', { type: 'apiKey', 'x-scalar-secret-token': 'query-secret' })
  store.auth.setAuthSecrets('events', 'cookie', { type: 'apiKey', 'x-scalar-secret-token': 'cookie-secret' })
  return { document, store }
}

describe('get-asyncapi-example-security', () => {
  it('selects query and cookie credentials and follows edits', async () => {
    const { document, store } = await setup()
    const context = getAsyncApiExampleContext(document, 'receive')
    const resolve = (): unknown[] =>
      getAsyncApiExampleSecurity(document, context, store.auth).map((scheme) => [
        scheme.type,
        scheme.type === 'apiKey' ? scheme['x-scalar-secret-token'] : undefined,
      ])
    expect(resolve()).toEqual([['apiKey', 'query-secret']])
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: 'events' },
      { selectedIndex: 0, selectedSchemes: [{ cookie: [] }] },
    )
    expect(resolve()).toEqual([['apiKey', 'cookie-secret']])
    store.auth.setAuthSecrets('events', 'cookie', { type: 'apiKey', 'x-scalar-secret-token': 'updated' })
    expect(resolve()).toEqual([['apiKey', 'updated']])
  })

  it('does not attach credentials to a different server or use unsupported bearer auth', async () => {
    const { document, store } = await setup()
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: 'events' },
      { selectedIndex: 0, selectedSchemes: [{ bearer: [] }] },
    )
    expect(getAsyncApiExampleSecurity(document, getAsyncApiExampleContext(document, 'receive'), store.auth)).toEqual([])
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: 'events' },
      { selectedIndex: 0, selectedSchemes: [{ query: [] }] },
    )
    expect(
      getAsyncApiExampleSecurity(document, getAsyncApiExampleContext(document, 'receive', 'second'), store.auth),
    ).toEqual([])
  })

  it('honors no-auth selection and channel selection over document selection', async () => {
    const { document, store } = await setup()
    const context = getAsyncApiExampleContext(document, 'receive')
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: 'events' },
      { selectedIndex: -1, selectedSchemes: [] },
    )
    expect(getAsyncApiExampleSecurity(document, context, store.auth)).toEqual([])
    store.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName: 'events', path: 'events', method: 'get' },
      { selectedIndex: 0, selectedSchemes: [{ cookie: [] }] },
    )
    expect(
      getAsyncApiExampleSecurity(document, context, store.auth).map((scheme) =>
        scheme.type === 'apiKey' ? scheme['x-scalar-secret-token'] : undefined,
      ),
    ).toEqual(['cookie-secret'])
  })
  it('does not substitute a stored server credential for an incompatible selected scheme', async () => {
    const { document, store } = await setup()
    store.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: 'events' },
      { selectedIndex: 0, selectedSchemes: [{ operation: [] }] },
    )
    expect(getAsyncApiExampleSecurity(document, getAsyncApiExampleContext(document, 'receive'), store.auth)).toEqual([])
  })
})
