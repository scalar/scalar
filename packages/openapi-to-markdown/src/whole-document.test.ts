import { describe, expect, it } from 'vitest'

import { createOpenApiMarkdownRenderer } from './create-markdown-from-openapi'

const input = {
  openapi: '3.1.1',
  info: { title: 'Orders', version: '1' },
  paths: {
    '/orders': {
      post: {
        tags: ['Orders'],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } },
        responses: {
          '200': {
            description: 'Saved',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Order: {
        title: 'Order record',
        type: 'object',
        properties: {
          customer: { $ref: '#/components/schemas/Customer' },
          timestamp: { $ref: '#/components/schemas/Timestamp' },
          parent: { $ref: '#/components/schemas/Order' },
        },
      },
      Customer: { type: 'object', properties: { name: { type: 'string', description: 'Customer name.' } } },
      Timestamp: { type: 'string', format: 'date-time' },
      Alias: { $ref: '#/components/schemas/Customer', description: 'Alternate customer.' },
    },
  },
}

describe('whole-document', () => {
  it('gives shared schemas one canonical definition including aliases and recursion', async () => {
    const renderer = await createOpenApiMarkdownRenderer(input)
    const output = await renderer.render()
    const operations = output.slice(output.indexOf('## Operations'), output.indexOf('## Schemas'))
    expect(operations).toContain('[Order](#scalar-schema-order)')
    expect(operations).not.toContain('**`customer`**')
    expect(output.match(/### Order record/g)?.length).toBe(1)
    expect(output.match(/Customer name\./g)?.length).toBe(1)
    expect(output).toContain('- **`customer`**: [Customer](#scalar-schema-customer)')
    expect(output).toContain('- **`parent`**: [Order](#scalar-schema-order)')
    expect(output).toContain('- **`timestamp`**: `string`, format: `date-time`')
    expect(output).toContain('### Alias')
    expect(output).toContain('Alternate customer.')
    expect(output).not.toContain('shown above')
    expect(await renderer.render({})).toBe(output)
    expect(await renderer.render({ operation: undefined })).toBe(output)
  })

  it('preserves sibling constraints and anonymous schemas beside internal links', async () => {
    const renderer = await createOpenApiMarkdownRenderer({
      ...input,
      components: {
        schemas: {
          ...input.components.schemas,
          Extra: {
            type: 'object',
            properties: {
              customer: {
                $ref: '#/components/schemas/Customer',
                description: 'Override description.',
                required: ['id'],
                properties: { id: { type: 'integer', minimum: 1 } },
              },
              inline: { type: 'object', properties: { flag: { type: 'boolean' } } },
            },
          },
        },
      },
    })
    const output = await renderer.render()
    expect(output).toContain('Override description.')
    expect(output).toContain('**`id` (required)**: `integer`, minimum: `1`')
    expect(output).toContain('**`flag`**: `boolean`')
  })

  it('resolves escaped names and preserves explicit external URL choices', async () => {
    const renderer = await createOpenApiMarkdownRenderer({
      ...input,
      components: {
        schemas: {
          '猫/Pet': { title: 'Same title', type: 'object', properties: { id: { type: 'integer' } } },
          '猫~Pet': { title: 'Same title', type: 'array', items: { $ref: '#/components/schemas/%E7%8C%AB~1Pet' } },
        },
      },
    })
    const output = await renderer.render()
    expect(output).toContain('<a id="scalar-schema-猫pet"></a>')
    expect(output).toContain('<a id="scalar-schema-猫pet-1"></a>')
    expect(output).toContain('[猫/Pet](#scalar-schema-%E7%8C%ABpet)')
    const external = await renderer.render({
      schemaReferences: { mode: 'linked', resolveUrl: () => 'https://example.com/model' },
    })
    expect(external).toContain('[猫/Pet](https://example.com/model)')
    const unlinked = await renderer.render({ schemaReferences: { mode: 'linked', resolveUrl: () => undefined } })
    expect(unlinked).not.toContain('[猫/Pet](')
  })

  it('keeps single-item and tag page expansion unchanged', async () => {
    const renderer = await createOpenApiMarkdownRenderer(input)
    const operation = await renderer.render({ operation: { path: '/orders', method: 'post' } })
    expect(operation).toContain('- **`customer`**')
    expect(operation).toContain('shown above')
    expect(operation).not.toContain('<a id=')
    const model = await renderer.render({ model: 'Order' })
    expect(model.startsWith('# Order record\n')).toBe(true)
    expect(model).not.toContain('<a id=')
    const tag = await renderer.render({ tag: 'Orders' })
    expect(tag).toContain('- **`customer`**')
    expect(tag).not.toContain('<a id=')
  })
})
