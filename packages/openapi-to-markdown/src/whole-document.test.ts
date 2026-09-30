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
  it('retains array bounds and closed-object constraints beside linked references', async () => {
    const renderer = await createOpenApiMarkdownRenderer({
      openapi: '3.1.1',
      info: { title: 'Constraints', version: '1' },
      components: {
        schemas: {
          Items: { type: 'array', items: { type: 'string' } },
          Bounded: { $ref: '#/components/schemas/Items', minItems: 1, maxItems: 3, uniqueItems: true },
          Base: { type: 'object', properties: { id: { type: 'string' } } },
          Closed: { $ref: '#/components/schemas/Base', additionalProperties: false },
          NonNull: { $ref: '#/components/schemas/Base', type: 'object' },
          Container: {
            type: 'object',
            properties: {
              closed: { $ref: '#/components/schemas/Base', additionalProperties: false },
              bounded: { $ref: '#/components/schemas/Items', minItems: 2 },
            },
          },
        },
      },
    })
    const output = await renderer.render()
    expect(output).toContain('[Items](#scalar-schema-items), minItems: `1`, maxItems: `3`, uniqueItems: `true`')
    expect(output).toContain('[Items](#scalar-schema-items), minItems: `2`')
    expect(output.match(/no additional properties/g)?.length).toBe(2)
    expect(output).toContain('[Base](#scalar-schema-base), type: `object`')
  })

  it('separates path and webhook server destinations when their names match', async () => {
    const response = { '200': { description: 'OK' } }
    const renderer = await createOpenApiMarkdownRenderer({
      openapi: '3.1.1',
      info: { title: 'Servers', version: '1' },
      paths: {
        '/same': {
          servers: [{ url: 'https://path.example' }],
          get: { responses: response },
          post: { responses: response },
        },
      },
      webhooks: {
        '/same': {
          servers: [{ url: 'https://webhook.example' }],
          get: { responses: response },
          post: { responses: response },
        },
      },
    })
    const output = await renderer.render()
    expect(output).toContain('<a id="scalar-context-servers-same"></a>')
    expect(output).toContain('<a id="scalar-context-servers-webhook-same"></a>')
    expect(output).toContain('[Inherited servers](#scalar-context-servers-same)')
    expect(output).toContain('[Inherited servers](#scalar-context-servers-webhook-same)')
    expect(output.match(/https:\/\/path.example/g)?.length).toBe(1)
    expect(output.match(/https:\/\/webhook.example/g)?.length).toBe(1)
  })

  it('indexes only rendered operations, webhooks and component names with unique destinations', async () => {
    const response = { '200': { description: 'OK' } }
    const renderer = await createOpenApiMarkdownRenderer({
      ...input,
      info: { title: 'Navigation', version: '1', description: 'Read this introduction.' },
      paths: {
        '/a+b': { get: { summary: 'Repeated title', operationId: 'duplicate', tags: ['Orders'], responses: response } },
        '/ab': { get: { summary: 'Repeated title', operationId: 'duplicate', tags: ['Orders'], responses: response } },
        '/café': { post: { responses: response } },
      },
      webhooks: { 'order.created': { post: { responses: response } } },
    })
    const output = await renderer.render()
    const contents = output.slice(output.indexOf('## Contents'), output.indexOf('## Operations'))
    expect(output.indexOf('Read this introduction.')).toBeLessThan(output.indexOf('## Contents'))
    expect(contents).toContain('[GET /a+b]')
    expect(contents).toContain('[GET /ab]')
    expect(contents).toContain('[POST /café]')
    expect(contents).toContain('[POST order.created]')
    expect(contents).toContain('[Order](#scalar-schema-order)')
    expect(contents).not.toContain('Repeated title')
    expect(contents).not.toContain('Order record')
    const anchors = [...output.matchAll(/<a id="([^"]+)"><\/a>/g)].map((match) => match[1])
    expect(new Set(anchors).size).toBe(anchors.length)
    const links = [...output.matchAll(/\]\(#(scalar-[^)]+)\)/g)].map((match) => decodeURIComponent(match[1]!))
    expect(links.length).toBeGreaterThan(5)
    for (const destination of links) expect(anchors).toContain(destination)
    expect(await renderer.render({ tag: 'Orders' })).not.toContain('## Contents')
    expect(await renderer.render({ model: 'Order' })).not.toContain('## Contents')
  })

  it('omits empty navigation groups and the index for an empty document', async () => {
    const renderer = await createOpenApiMarkdownRenderer({ openapi: '3.1.1', info: { title: 'Empty', version: '1' } })
    expect(await renderer.render()).not.toContain('## Contents')
    const models = await createOpenApiMarkdownRenderer({ ...input, paths: {} })
    const output = await models.render()
    expect(output).toContain('## Contents')
    expect(output).not.toContain('**Operations**')
    expect(output).not.toContain('**Webhooks**')
  })

  it('explains global and path servers once while keeping operation overrides and variables', async () => {
    const response = { '200': { description: 'OK' } }
    const renderer = await createOpenApiMarkdownRenderer({
      openapi: '3.1.1',
      info: { title: 'Servers', version: '1' },
      servers: [{ url: 'https://global.example', description: 'Global server.' }],
      paths: {
        '/global': { get: { responses: response } },
        '/path': {
          servers: [
            {
              url: 'https://{region}.example',
              variables: {
                region: { default: 'eu', enum: ['eu', 'us'], description: 'Choose your **region**.' },
              },
            },
          ],
          get: { responses: response },
          post: { responses: response },
          put: { servers: [{ url: 'https://override.example' }], responses: response },
          delete: { servers: [], responses: response },
        },
      },
    })
    const output = await renderer.render()
    expect(output.match(/https:\/\/global\.example/g)?.length).toBe(1)
    expect(output.match(/https:\/\/\{region\}\.example/g)?.length).toBe(1)
    expect(output).toContain('[Inherited servers](#scalar-context-global-servers)')
    expect(output).toContain('[Inherited servers](#scalar-context-servers-path)')
    expect(output).toContain('region: `eu`, possible values: `eu, us`')
    expect(output).toContain('Choose your **region**.')
    expect(output).toContain('https://override.example')
    const deletion = output.slice(output.indexOf('### DELETE /path'))
    expect(deletion).toContain('#### Effective servers\n\n- `/`')
    const selected = await renderer.render({ operation: { path: '/global', method: 'get' } })
    expect(selected).toContain('## Effective servers')
    expect(selected).toContain('https://global.example')
    expect(selected).not.toContain('[Inherited servers]')
  })

  it('links global authentication and preserves anonymous and alternative operation requirements', async () => {
    const response = { '200': { description: 'OK' } }
    const renderer = await createOpenApiMarkdownRenderer({
      openapi: '3.1.1',
      info: { title: 'Authentication', version: '1' },
      security: [{ key: [], oauth: ['read'] }, { oauth: ['admin'] }],
      paths: {
        '/global': { get: { responses: response } },
        '/anonymous': { get: { security: [], responses: response } },
        '/override': { get: { security: [{ oauth: ['write'] }, {}], responses: response } },
      },
      components: {
        securitySchemes: {
          key: { type: 'apiKey', in: 'header', name: 'X-Key', description: 'Global key description.' },
          oauth: {
            type: 'oauth2',
            flows: {
              clientCredentials: {
                tokenUrl: 'https://auth.example/token',
                scopes: { read: 'Read', write: 'Write', admin: 'Admin' },
              },
            },
          },
        },
      },
    })
    const output = await renderer.render()
    expect(output.match(/Global key description\./g)?.length).toBe(1)
    expect(output).toContain('[Global authentication](#scalar-context-global-authentication)')
    expect(output).toContain('scopes: `read`')
    expect(output).toContain('scopes: `admin`')
    expect(output).toContain('scopes: `write`')
    expect(output.match(/No authentication required\./g)?.length).toBe(2)
    expect(output.match(/\nOr:\n/g)?.length).toBe(2)
    expect(output.slice(output.indexOf('### GET /anonymous'), output.indexOf('### GET /override'))).toContain(
      'No authentication required.',
    )
  })

  it('retains an explicit empty global server list without inventing authentication', async () => {
    const renderer = await createOpenApiMarkdownRenderer({
      openapi: '3.1.1',
      info: { title: 'Defaults', version: '1' },
      servers: [],
      paths: {
        '/': {
          get: {
            parameters: [{ in: 'header', name: 'X-Key', schema: { type: 'string' } }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    })
    const output = await renderer.render()
    expect(output).toContain('**URL:** `/`')
    expect(output).toContain('[Inherited servers](#scalar-context-global-servers)')
    expect(output).not.toContain('Authentication')
    expect(output).not.toContain('No authentication required')
  })

  it('deduplicates generated examples without merging request, response, or media type contexts', async () => {
    const schema = { $ref: '#/components/schemas/Record' }
    const operation = {
      requestBody: { content: { 'application/json': { schema } } },
      responses: {
        '200': { description: 'OK', content: { 'application/json': { schema }, 'application/xml': { schema } } },
      },
    }
    const renderer = await createOpenApiMarkdownRenderer({
      openapi: '3.1.1',
      info: { title: 'Examples', version: '1' },
      paths: { '/first': { post: operation }, '/second': { post: operation } },
      components: {
        schemas: {
          Record: {
            type: 'object',
            properties: { id: { type: 'integer', readOnly: true }, secret: { type: 'string', writeOnly: true } },
          },
        },
      },
    })
    const output = await renderer.render()
    expect(output.match(/\*\*Generated example:\*\*/g)?.length).toBe(4)
    expect(output.match(/\[Generated example\]\(#scalar-example-/g)?.length).toBe(3)
    expect(output.match(/```json\n/g)?.length).toBe(3)
    expect(output.match(/```xml\n/g)?.length).toBe(1)
    expect(output).toContain('```json\n{\n  "secret": ""\n}\n```')
    expect(output).toContain('```json\n{\n  "id": 1\n}\n```')
    expect(await renderer.render()).toBe(output)
    expect(await Promise.all([renderer.render(), renderer.render()])).toStrictEqual([output, output])
  })

  it('keeps every authored schema example at its original usage', async () => {
    const schema = { $ref: '#/components/schemas/Record' }
    const response = { description: 'OK', content: { 'application/json': { schema } } }
    const renderer = await createOpenApiMarkdownRenderer({
      openapi: '3.1.1',
      info: { title: 'Authored', version: '1' },
      paths: {
        '/first': { get: { responses: { '200': response } } },
        '/second': { get: { responses: { '200': response } } },
      },
      components: { schemas: { Record: { type: 'object', examples: [{ id: 42 }, { id: 43 }] } } },
    })
    const output = await renderer.render()
    expect(output.match(/\*\*Example:\*\*/g)?.length).toBe(6)
    expect(output.match(/"id": 42/g)?.length).toBe(3)
    expect(output.match(/"id": 43/g)?.length).toBe(3)
    expect(output).not.toContain('Generated example')
  })

  it('keeps constraints beside references in their own generated examples', async () => {
    const renderer = await createOpenApiMarkdownRenderer({
      openapi: '3.1.1',
      info: { title: 'Defaults', version: '1' },
      paths: {
        '/first': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Count', default: 42 },
                  },
                },
              },
            },
          },
        },
        '/second': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Count', default: 43 },
                  },
                },
              },
            },
          },
        },
      },
      components: { schemas: { Count: { type: 'integer' } } },
    })
    const output = await renderer.render()
    expect(output).toContain('```json\n42\n```')
    expect(output).toContain('```json\n43\n```')
    expect(output).not.toContain('[Generated example](')
  })

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
    expect(unlinked.slice(unlinked.indexOf('## Operations'))).not.toContain('[猫/Pet](')
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
