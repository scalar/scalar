// @vitest-environment node
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { describe, expect, it, vi } from 'vitest'

import { prepareApiReference } from './prepare-api-reference'

const content = {
  openapi: '3.1.0',
  info: { title: 'Prepared API', version: '1.0.0' },
  servers: [{ url: 'https://example.com' }],
  paths: {
    '/things': { get: { summary: 'List things', responses: { '200': { description: 'OK' } } } },
  },
}

describe('prepare-api-reference', () => {
  it('prepares independent reference and client documents without invoking lifecycle callbacks', async () => {
    const onLoaded = vi.fn()
    const onDocumentSelect = vi.fn()
    const prepared = await prepareApiReference({ content, onLoaded, onDocumentSelect })

    expect(prepared.slug).toBe('api-1')
    expect(prepared.workspace.meta['x-scalar-active-document']).toBe('api-1')
    expect(prepared.clientWorkspace.meta['x-scalar-active-document']).toBe('api-1')
    expect(prepared.workspace.documents['api-1']?.info.title).toBe('Prepared API')
    expect(prepared.clientWorkspace.documents['api-1']?.['x-scalar-selected-server']).toBe('https://example.com')
    expect(prepared.workspace.documents['api-1']).not.toBe(prepared.clientWorkspace.documents['api-1'])
    expect(onLoaded).not.toHaveBeenCalled()
    expect(onDocumentSelect).not.toHaveBeenCalled()
  })

  it('prepares configured servers and document environment defaults consistently', async () => {
    const prepared = await prepareApiReference({
      servers: [{ url: 'https://configured.example.com/{region}', variables: { region: { default: 'eu' } } }],
      content: {
        ...content,
        'x-scalar-environments': { production: { variables: [{ name: 'token', value: 'secret' }] } },
        'x-scalar-active-environment': 'production',
      },
    })
    const document = prepared.clientWorkspace.documents['api-1']
    if (!isOpenApiDocument(document)) {
      throw new Error('Expected the prepared OpenAPI document')
    }
    expect(document.servers).toStrictEqual([
      { url: 'https://configured.example.com/{region}', variables: { region: { default: 'eu' } } },
    ])
    expect(document['x-scalar-selected-server']).toBe('https://configured.example.com/{region}')
    expect(prepared.workspace.meta['x-scalar-active-environment']).toBe('production')
    expect(prepared.clientWorkspace.meta['x-scalar-active-environment']).toBe('production')
  })

  it('loads only the default source and resolves external references before returning', async () => {
    const customFetch = vi.fn((input: string | URL | Request) => {
      const url = String(input)
      return Promise.resolve(
        new Response(
          JSON.stringify(
            url.endsWith('model.json')
              ? { type: 'string', description: 'Resolved model' }
              : {
                  ...content,
                  components: { schemas: { Thing: { $ref: './model.json' } } },
                },
          ),
        ),
      )
    })
    const prepared = await prepareApiReference({
      customFetch,
      sources: [
        { slug: 'unused', url: 'https://example.com/unused.json' },
        { slug: 'selected', default: true, url: 'https://example.com/openapi.json' },
      ],
    })

    expect(prepared.slug).toBe('selected')
    expect(Object.keys(prepared.workspace.documents)).toStrictEqual(['selected'])
    expect(customFetch.mock.calls.map(([url]) => String(url))).toStrictEqual([
      'https://example.com/openapi.json',
      'https://example.com/model.json',
    ])
    const document = prepared.workspace.documents.selected
    if (!isOpenApiDocument(document)) {
      throw new Error('Expected the prepared OpenAPI document')
    }
    expect(document.components?.schemas?.Thing).toStrictEqual({
      $ref: '#/x-ext/67d5c21',
    })
    expect('x-ext' in document ? document['x-ext'] : undefined).toStrictEqual({
      '67d5c21': { type: 'string', description: 'Resolved model' },
    })
  })

  it('rejects preparation when the initial source cannot be loaded', async () => {
    const customFetch = vi.fn(async () => new Response('Unavailable', { status: 503 }))
    await expect(prepareApiReference({ url: 'https://example.com/openapi.json', customFetch })).rejects.toThrow(
      'Could not prepare API reference document "api-1" for hydration',
    )
  })
})
