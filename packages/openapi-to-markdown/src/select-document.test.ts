import { getPathItemOperation, getResolvedPathItem } from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi } from './browser'
import { type OpenApiRenderOptions, selectDocument } from './select-document'

const custom = {
  operationId: 'purgeCache',
  tags: ['cache'],
  responses: { '204': { description: 'Purged' } },
}
const document = {
  'x-scalar-original-document-hash': '',
  openapi: '3.2.0',
  info: { title: 'Custom methods', version: '1' },
  security: [{ Token: [] }],
  servers: [{ url: 'https://example.com' }],
  paths: {
    '/cache': {
      parameters: [{ name: 'key', in: 'query', schema: { type: 'string' } }],
      get: { summary: 'Fixed read' },
      additionalOperations: {
        purge: custom,
        PURGE: { summary: 'Uppercase purge' },
        GET: { summary: 'Additional read' },
      },
    },
  },
  webhooks: { cache: { post: { summary: 'Fixed webhook' }, additionalOperations: { purge: custom } } },
  components: { securitySchemes: { Token: { type: 'http', scheme: 'bearer' } } },
} satisfies OpenApiDocument

describe('select-document', () => {
  it.each<OpenApiRenderOptions>([
    { operation: { path: '/cache', method: 'purge' } },
    { operation: { operationId: 'purgeCache' } },
    { operation: { pointer: '#/paths/~1cache/additionalOperations/purge' } },
    { tag: 'cache' },
  ])('selects only the custom operation and preserves inherited context for %j', (options) => {
    const selected = selectDocument(document, options)
    const item = getResolvedPathItem(selected.paths?.['/cache'])
    expect(item?.get).toBeUndefined()
    expect(item?.additionalOperations).toStrictEqual({
      purge: {
        ...custom,
        parameters: document.paths?.['/cache']?.parameters,
        servers: document.servers,
        security: document.security,
      },
    })
    expect(selected.components?.securitySchemes).toStrictEqual(document.components?.securitySchemes)
    expect(document.paths?.['/cache']?.additionalOperations?.purge).toStrictEqual(custom)
  })

  it('keeps fixed and uppercase additional operations separate', () => {
    const fixed = selectDocument(document, { operation: { path: '/cache', method: 'get' } })
    const additional = selectDocument(document, { operation: { path: '/cache', method: 'GET' } })
    expect(getPathItemOperation(fixed.paths?.['/cache'], 'get')?.summary).toBe('Fixed read')
    expect(getResolvedPathItem(fixed.paths?.['/cache'])?.additionalOperations).toBeUndefined()
    expect(getPathItemOperation(additional.paths?.['/cache'], 'get')).toBeUndefined()
    expect(getPathItemOperation(additional.paths?.['/cache'], 'GET')?.summary).toBe('Additional read')
  })

  it('does not fall back from an absent additional-operation pointer to a fixed method', () => {
    expect(() =>
      selectDocument(document, { operation: { pointer: '#/paths/~1cache/additionalOperations/Get' } }),
    ).toThrow('Operation not found at JSON pointer')
    expect(() => selectDocument(document, { operation: { pointer: '#/paths/~1cache/GET' } })).toThrow(
      'must target an operation object',
    )
  })

  it.each<OpenApiRenderOptions>([
    { operation: { path: '/cache', method: 'purge' } },
    { webhook: { name: 'cache', method: 'purge' } },
  ])('renders custom method case and inherited security for %j', async (options) => {
    const markdown = await createMarkdownFromOpenApi(document, options)
    expect(markdown).toContain('**Method:**\u00a0`purge`')
    expect(markdown).toContain('https://example.com')
    expect(markdown).toContain('Token')
    expect(markdown).not.toContain('Uppercase purge')
    expect(markdown).not.toContain('Fixed read')
    expect(markdown).not.toContain('Fixed webhook')
  })
})
