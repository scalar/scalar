import { describe, expect, it } from 'vitest'

import { createMarkdownFromAsyncApi } from './index'

const model = async (schema: unknown): Promise<string> =>
  createMarkdownFromAsyncApi(
    { asyncapi: '3.1.0', info: { title: 'API', version: '1' }, components: { schemas: { Example: schema } } },
    { model: 'Example' },
  )

describe('render-schema', () => {
  it('renders boolean schemas explicitly', async () => {
    expect(await model(false)).toBe('<a id="scalar-model-example"></a>\n\n# Example\n\nNo value is allowed.\n')
    expect(await model(true)).toBe('<a id="scalar-model-example"></a>\n\n# Example\n\nAny value is allowed.\n')
  })

  it('preserves JSON Schema constraints and required properties', async () => {
    const result = await model({
      type: 'object',
      required: ['count'],
      properties: {
        count: { type: 'integer', minimum: 0, maximum: 10 },
        label: { type: ['string', 'null'], enum: ['ok', null] },
      },
      additionalProperties: false,
    })
    expect(result).toBe(
      '<a id="scalar-model-example"></a>\n\n# Example\n\n`object`\n\n- **`count`**: `integer`, minimum: `0`, maximum: `10` (required)\n- **`label`**: `string | null`, enum: `["ok",null]`\n\n**additionalProperties:**\n\nNo value is allowed.\n\n<a id="scalar-example-1"></a>\n\n**Generated example:**\n\n```json\n{\n  "count": 0,\n  "label": "ok"\n}\n```\n',
    )
  })

  it('renders composition, tuple items and conditional schemas', async () => {
    const result = await model({
      allOf: [{ type: 'array', items: [{ type: 'string' }, { type: 'number' }] }],
      if: { const: 1 },
      then: false,
      else: true,
    })
    expect(result).toContain('allOf:')
    expect(result).toContain('`number`')
    expect(result).toContain('if:')
    expect(result).toContain('No value is allowed.')
  })

  it('renders multi-format JSON Schema and labelled source for other formats', async () => {
    expect(await model({ schemaFormat: 'application/schema+json;version=draft-07', schema: { type: 'string' } })).toBe(
      '<a id="scalar-model-example"></a>\n\n# Example\n\n`string`\n',
    )
    const result = await model({
      schemaFormat: 'application/vnd.google.protobuf;version=3',
      schema: 'message Order { string id = 1; }',
    })
    expect(result).toContain('application/vnd.google.protobuf;version=3')
    expect(result).toContain('message Order { string id = 1; }')
  })

  it('preserves Markdown and sanitizes HTML descriptions', async () => {
    const result = await model({
      type: 'string',
      description: 'Text **bold**.\n\n```js\nconst value = 1\n```\n\n<script>alert(1)</script><p>Safe</p><img src="x">',
    })
    expect(result).toContain('**bold**')
    expect(result).toContain('const value = 1')
    expect(result).toContain('Safe')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('<img')
  })

  it('retains literal references in authored examples without interpreting them', async () => {
    const result = await model({
      type: 'object',
      examples: [{ $ref: './literal-not-a-schema.json', nested: { value: 1 } }],
    })
    expect(result).toContain('"$ref": "./literal-not-a-schema.json"')
    expect(result).toContain('"value": 1')
  })

  it('resolves schemas whose names match data or map keywords', async () => {
    const result = await model({
      type: 'object',
      properties: {
        examples: { type: 'string', examples: [{ $ref: './literal.json' }] },
        properties: { type: 'number', default: { $ref: './another-literal.json' } },
      },
    })
    expect(result).toContain('`examples`')
    expect(result).toContain('`properties`')
    expect(result).toContain('./literal.json')
    expect(result).toContain('./another-literal.json')
  })

  it('serializes authored strings as JSON values', async () => {
    expect(await model({ type: 'string', examples: ['hello'] })).toContain('```json\n"hello"\n```')
  })

  it('preserves required constraints without property definitions', async () => {
    expect(await model({ required: ['id'] })).toBe(
      '<a id="scalar-model-example"></a>\n\n# Example\n\n**Required properties:** `id`\n',
    )
  })
  it('renders discriminator fields and variant mappings', async () => {
    const result = await model({
      oneOf: [{ type: 'object', properties: { kind: { const: 'cat' } } }],
      discriminator: { propertyName: 'kind', mapping: { cat: '#/components/schemas/Cat' } },
    })
    expect(result).toContain('**Discriminator:** `kind`')
    expect(result).toContain('`cat`: `#/components/schemas/Cat`')
    expect(await model({ type: 'object', discriminator: 'kind' })).toContain('**Discriminator:** `kind`')
  })

  it('keeps property annotations on one line before Markdown descriptions', async () => {
    const result = await model({
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', minLength: 2, description: 'Identifier **description**.' },
      },
    })
    expect(result).toContain('- **`id`**: `string`, format: `uuid`, minLength: `2`\n\n  Identifier **description**.')
  })
})
