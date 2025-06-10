import { describe, it, expect } from 'vitest'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { traverseWebhooks } from './traverse-webhooks'
import type { TraversedEntry, TraverseSpecOptions } from '@/schemas/traverse-schema/types'

describe('traverse-webhooks', () => {
  const mockGetWebhookId: TraverseSpecOptions['getWebhookId'] = (params, tag) => {
    if (!params) {
      return 'untagged-unknown-unknown'
    }
    return `${tag?.name || 'untagged'}-${params.method || 'unknown'}-${params.name}`
  }

  const mockTagsDict = new Map<string, OpenAPIV3_1.TagObject>([
    ['webhook-tag', { name: 'webhook-tag', description: 'Webhook tag' }],
  ])

  describe('traverseWebhooks', () => {
    it('should handle empty webhooks', () => {
      const content: OpenAPIV3_1.Document = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
      }

      const tagsMap = new Map<string, TraversedEntry[]>()
      const titlesMap = new Map<string, string>()

      const result = traverseWebhooks(content, tagsMap, mockTagsDict, titlesMap, mockGetWebhookId)

      expect(result).toEqual([])
      expect(tagsMap.size).toBe(0)
      expect(titlesMap.size).toBe(0)
    })

    it('should process webhooks with tags', () => {
      const content: OpenAPIV3_1.Document = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        webhooks: {
          'test-webhook': {
            post: {
              summary: 'Test Webhook',
              tags: ['webhook-tag'],
              operationId: 'testWebhook',
            },
          },
        },
      }

      const tagsMap = new Map<string, TraversedEntry[]>()
      const titlesMap = new Map<string, string>()

      const result = traverseWebhooks(content, tagsMap, mockTagsDict, titlesMap, mockGetWebhookId)

      expect(result).toEqual([]) // Should be empty as webhook has a tag
      expect(tagsMap.get('webhook-tag')).toHaveLength(1)
      expect(tagsMap.get('webhook-tag')?.[0]).toEqual({
        id: 'webhook-tag-post-test-webhook',
        title: 'Test Webhook',
        name: 'test-webhook',
        method: 'post',
        ref: '#/webhooks/test-webhook/post',
        type: 'webhook',
      })
      expect(titlesMap.get('webhook-tag-post-test-webhook')).toBe('Test Webhook')
    })

    it('should process untagged webhooks', () => {
      const content: OpenAPIV3_1.Document = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        webhooks: {
          'untagged-webhook': {
            post: {
              summary: 'Untagged Webhook',
              operationId: 'untaggedWebhook',
            },
          },
        },
      }

      const tagsMap = new Map<string, TraversedEntry[]>()
      const titlesMap = new Map<string, string>()

      const result = traverseWebhooks(content, tagsMap, mockTagsDict, titlesMap, mockGetWebhookId)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'untagged-post-untagged-webhook',
        title: 'Untagged Webhook',
        name: 'untagged-webhook',
        method: 'post',
        ref: '#/webhooks/untagged-webhook/post',
        type: 'webhook',
      })
      expect(titlesMap.get('untagged-post-untagged-webhook')).toBe('Untagged Webhook')
    })

    it('should skip internal webhooks', () => {
      const content: OpenAPIV3_1.Document = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        webhooks: {
          'internal-webhook': {
            post: {
              summary: 'Internal Webhook',
              'x-internal': true,
              operationId: 'internalWebhook',
            },
          },
        },
      }

      const tagsMap = new Map<string, TraversedEntry[]>()
      const titlesMap = new Map<string, string>()

      const result = traverseWebhooks(content, tagsMap, mockTagsDict, titlesMap, mockGetWebhookId)

      expect(result).toEqual([])
      expect(tagsMap.size).toBe(0)
      expect(titlesMap.size).toBe(0)
    })

    it('should skip scalar-ignore webhooks', () => {
      const content: OpenAPIV3_1.Document = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        webhooks: {
          'ignored-webhook': {
            post: {
              summary: 'Ignored Webhook',
              'x-scalar-ignore': true,
              operationId: 'ignoredWebhook',
            },
          },
        },
      }

      const tagsMap = new Map<string, TraversedEntry[]>()
      const titlesMap = new Map<string, string>()

      const result = traverseWebhooks(content, tagsMap, mockTagsDict, titlesMap, mockGetWebhookId)

      expect(result).toEqual([])
      expect(tagsMap.size).toBe(0)
      expect(titlesMap.size).toBe(0)
    })

    it('should handle deprecated webhooks', () => {
      const content: OpenAPIV3_1.Document = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        webhooks: {
          'deprecated-webhook': {
            post: {
              summary: 'Deprecated Webhook',
              deprecated: true,
              operationId: 'deprecatedWebhook',
            },
          },
        },
      }

      const tagsMap = new Map<string, TraversedEntry[]>()
      const titlesMap = new Map<string, string>()

      const result = traverseWebhooks(content, tagsMap, mockTagsDict, titlesMap, mockGetWebhookId)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'untagged-post-deprecated-webhook',
        title: 'Deprecated Webhook',
        name: 'deprecated-webhook',
        method: 'post',
        ref: '#/webhooks/deprecated-webhook/post',
        type: 'webhook',
      })
    })

    it('should handle webhooks with multiple methods', () => {
      const content: OpenAPIV3_1.Document = {
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {},
        webhooks: {
          'multi-method-webhook': {
            post: {
              summary: 'POST Webhook',
              operationId: 'postWebhook',
            },
            get: {
              summary: 'GET Webhook',
              operationId: 'getWebhook',
            },
          },
        },
      }

      const tagsMap = new Map<string, TraversedEntry[]>()
      const titlesMap = new Map<string, string>()

      const result = traverseWebhooks(content, tagsMap, mockTagsDict, titlesMap, mockGetWebhookId)

      expect(result).toHaveLength(2)
      expect(result).toEqual(
        expect.arrayContaining([
          {
            id: 'untagged-post-multi-method-webhook',
            title: 'POST Webhook',
            name: 'multi-method-webhook',
            method: 'post',
            ref: '#/webhooks/multi-method-webhook/post',
            type: 'webhook',
          },
          {
            id: 'untagged-get-multi-method-webhook',
            title: 'GET Webhook',
            name: 'multi-method-webhook',
            method: 'get',
            ref: '#/webhooks/multi-method-webhook/get',
            type: 'webhook',
          },
        ]),
      )
    })
  })
})
