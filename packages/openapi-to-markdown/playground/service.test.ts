import { describe, expect, it } from 'vitest'

import { loadDocument } from '../src/load-document'
import { getManifest } from './service'

describe('service', () => {
  it('selects duplicate operation IDs by path and includes webhook, model, tag, and introduction pages', async () => {
    const document = await loadDocument({
      openapi: '3.1.1',
      info: { title: 'Example', version: '1' },
      paths: {
        '/a': { get: { operationId: 'same', tags: ['Items'], responses: {} } },
        '/b': { post: { operationId: 'same', tags: ['Items'], responses: {} } },
      },
      webhooks: { 'item.created': { post: { responses: {} } } },
      components: { schemas: { 'Item/Record': { type: 'object' } } },
    })
    expect(getManifest(document)).toStrictEqual({
      title: 'Example',
      operations: 2,
      models: 1,
      pages: [
        { label: 'Introduction', options: { introduction: true } },
        { label: 'GET /a', options: { operation: { path: '/a', method: 'get' } } },
        { label: 'POST /b', options: { operation: { path: '/b', method: 'post' } } },
        { label: 'Webhook: POST item.created', options: { webhook: { name: 'item.created', method: 'post' } } },
        { label: 'Model: Item/Record', options: { model: 'Item/Record' } },
        { label: 'Tag: Items', options: { tag: 'Items' } },
      ],
    })
  })
})
