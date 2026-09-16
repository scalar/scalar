import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'

import { createHtmlFromOpenApi, createMarkdownFromOpenApi } from './create-markdown-from-openapi'

const document = {
  openapi: '3.1.1',
  info: { title: 'Chunked API', version: '1', description: 'See [the guide](https://example.com).' },
  tags: [{ name: 'First' }, { name: 'Second' }],
  paths: {
    '/first': { get: { summary: 'First operation', responses: { '200': { description: 'First response' } } } },
    '/second': { post: { summary: 'Second operation', responses: { '201': { description: 'Second response' } } } },
  },
  webhooks: { event: { post: { summary: 'An event', responses: { '200': { description: 'Received' } } } } },
  components: { schemas: { First: { type: 'string' }, Second: { type: 'integer' } } },
}

describe('large-document', () => {
  it('preserves Markdown across section boundaries', async () => {
    const html = await createHtmlFromOpenApi(document)
    const expected = await unified()
      .use(rehypeParse, { fragment: true })
      .use(remarkGfm)
      .use(rehypeSanitize)
      .use(rehypeRemark)
      .use(remarkStringify, { bullet: '-' })
      .process(html)
    const markdown = await createMarkdownFromOpenApi(document)
    expect(markdown).toBe(String(expected))
    expect(markdown.match(/^## .+$/gm)).toEqual(['## Tags', '## Operations', '## Webhooks', '## Schemas'])
    expect(markdown.match(/^### .+$/gm)).toEqual([
      '### First',
      '### Second',
      '### First operation',
      '### Second operation',
      '### An event',
      '### First',
      '### Second',
    ])
  })

  it('renders every operation and schema without repeating section headings', async () => {
    const count = 1500
    const input = {
      openapi: '3.1.1',
      info: { title: 'Large API', version: '1' },
      paths: Object.fromEntries(
        Array.from({ length: count }, (_, index) => [
          `/path-${index}`,
          {
            get: { summary: `Operation ${index}`, responses: { '200': { description: `Response ${index}` } } },
          },
        ]),
      ),
      components: {
        schemas: Object.fromEntries(
          Array.from({ length: count }, (_, index) => [
            `Model ${index}`,
            { type: 'string', description: `Description ${index}` },
          ]),
        ),
      },
    }
    const markdown = await createMarkdownFromOpenApi(input)
    expect(markdown.match(/^## .+$/gm)).toEqual(['## Operations', '## Schemas'])
    expect(markdown.match(/^### .+$/gm)).toEqual([
      ...Array.from({ length: count }, (_, index) => `### Operation ${index}`),
      ...Array.from({ length: count }, (_, index) => `### Model ${index}`),
    ])
    expect(markdown).toContain('Response 1499')
    expect(markdown).toContain('Description 1499')
  }, 30_000)

  it('preserves the authored method order within each path', async () => {
    const markdown = await createMarkdownFromOpenApi({
      openapi: '3.1.1',
      info: { title: 'Ordered API', version: '1' },
      paths: { '/ordered': { post: { summary: 'Create' }, get: { summary: 'Read' }, delete: { summary: 'Delete' } } },
    })
    expect(markdown.match(/^### .+$/gm)).toEqual(['### Create', '### Read', '### Delete'])
  })

  it('accepts proxied documents without modifying their source or expanding stored references', async () => {
    const input = {
      ...document,
      components: {
        schemas: {
          Name: { type: 'string', description: 'Resolved name' },
          Alias: { $ref: '#/components/schemas/Name' },
        },
      },
    }
    const original = structuredClone(input)
    const markdown = await createMarkdownFromOpenApi(createMagicProxy(input))
    expect(markdown).toContain('Resolved name')
    expect(input).toEqual(original)
  })
})
