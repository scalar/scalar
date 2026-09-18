import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { EncodingObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'

import { buildMultipart } from './build-multipart'
import { buildRequestBody } from './build-request-body'
import { encodeMultipartBody } from './encode-multipart-body'

/** Read part headers and values without depending on random boundary identifiers. */
const wireParts = async (body: Blob): Promise<string[]> => {
  const boundary = body.type.match(/boundary="?([^";]+)/)?.[1]
  return (await body.text())
    .split(`--${boundary}`)
    .slice(1, -1)
    .map((part) => part.slice(2, -2))
}

describe('build-multipart', () => {
  it('retains author parameters when resolving a matching wildcard to a concrete media type', async () => {
    const parts = buildMultipart([new Blob(['image'], { type: 'image/png' })], 'multipart/mixed', {
      itemEncoding: { contentType: 'image/*; charset=utf-8' },
    })
    expect(await wireParts(encodeMultipartBody(parts, 'multipart/mixed'))).toStrictEqual([
      'Content-Type: image/png; charset=utf-8\r\n\r\nimage',
    ])
  })

  it('uses the inferred type when every declared range fails to match', async () => {
    const parts = buildMultipart(['hello'], 'multipart/mixed', {
      itemEncoding: { contentType: 'image/*; charset=utf-8, audio/*' },
    })
    expect(await wireParts(encodeMultipartBody(parts, 'multipart/mixed'))).toStrictEqual([
      'Content-Type: text/plain\r\n\r\nhello',
    ])
  })

  it('uses the first concrete choice when the inferred type matches no choice', async () => {
    const parts = buildMultipart(['hello'], 'multipart/mixed', {
      itemEncoding: { contentType: 'image/*, application/custom; charset=utf-8, text/custom' },
    })
    expect(await wireParts(encodeMultipartBody(parts, 'multipart/mixed'))).toStrictEqual([
      'Content-Type: application/custom; charset=utf-8\r\n\r\nhello',
    ])
  })

  it.each(['hello', { id: 1 }])('uses the OpenAPI binary default for an untyped schema and value %j', async (value) => {
    const parts = buildMultipart(
      [value],
      'multipart/mixed',
      {},
      { type: 'array', items: coerceValue(SchemaObjectSchema, {}) },
    )
    expect(await wireParts(encodeMultipartBody(parts, 'multipart/mixed'))).toStrictEqual([
      `Content-Type: application/octet-stream\r\n\r\n${typeof value === 'string' ? value : JSON.stringify(value)}`,
    ])
  })

  it.each([{}, { id: 1, name: 'x' }])('rejects ambiguous named positional items: %j', (item) => {
    expect(() => buildMultipart([item], 'multipart/form-data', { itemEncoding: {} })).toThrow(
      'Named positional multipart items must contain exactly one property',
    )
  })

  it('accepts eight multipart levels and rejects a ninth', async () => {
    const encoding: EncodingObject = { contentType: 'multipart/mixed' }
    encoding.itemEncoding = encoding
    const value = Array.from({ length: 7 }).reduce<unknown>((value) => [value], ['leaf'])
    const parts = buildMultipart(value, 'multipart/mixed', encoding)
    expect(await encodeMultipartBody(parts, 'multipart/mixed').text()).toContain('leaf\r\n')
    expect(() => buildMultipart([value], 'multipart/mixed', encoding)).toThrow('Maximum multipart nesting exceeded')
  })

  it('rejects a cyclic multipart example behind a reactive proxy', () => {
    const value: unknown[] = []
    value.push(value)
    const encoding: EncodingObject = { contentType: 'multipart/mixed' }
    encoding.itemEncoding = encoding
    expect(() => buildMultipart(reactive(value), 'multipart/mixed', encoding)).toThrow(
      'Maximum multipart nesting exceeded',
    )
  })

  it('uses the schema root name for an XML multipart document', async () => {
    const parts = buildMultipart(
      [{ id: 1, name: 'Alice' }],
      'multipart/mixed',
      { itemEncoding: { contentType: 'application/xml' } },
      {
        type: 'array',
        items: {
          type: 'object',
          xml: { name: 'user' },
          properties: { id: { type: 'integer' }, name: { type: 'string' } },
        },
      },
    )
    expect(await wireParts(encodeMultipartBody(parts, 'multipart/mixed'))).toStrictEqual([
      'Content-Type: application/xml\r\n\r\n<?xml version="1.0" encoding="UTF-8"?>\n<user>\n  <id>1</id>\n  <name>Alice</name>\n</user>',
    ])
  })

  it.each([{ id: 1 }, { id: 1, name: 'Alice' }])('keeps the fallback XML root stable for %j', (value) => {
    expect(
      buildMultipart([value], 'multipart/mixed', {
        itemEncoding: { contentType: 'application/xml' },
      }),
    ).toStrictEqual([
      {
        type: 'text',
        contentType: 'application/xml',
        value: `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <id>1</id>\n${'name' in value ? '  <name>Alice</name>\n' : ''}</root>`,
      },
    ])
  })

  it('serializes XML objects inside nested multipart while escaping text', async () => {
    const parts = buildMultipart([[{ info: 'a & b' }]], 'multipart/mixed', {
      itemEncoding: { contentType: 'multipart/mixed', itemEncoding: { contentType: 'application/xml' } },
    })
    const wire = await encodeMultipartBody(parts, 'multipart/mixed').text()
    expect(wire).toContain(
      'Content-Type: application/xml\r\n\r\n<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <info>a &amp; b</info>\n</root>\r\n',
    )
    expect(wire).not.toContain('{"info"')
  })

  it('maps contentEncoding to a transfer header without modifying encoded bytes', async () => {
    const parts = buildMultipart(
      ['aGVsbG8='],
      'multipart/mixed',
      {},
      { type: 'array', items: { type: 'string', contentEncoding: 'base64' } },
    )
    expect(await wireParts(encodeMultipartBody(parts, 'multipart/mixed'))).toStrictEqual([
      'Content-Type: application/octet-stream\r\nContent-Transfer-Encoding: base64\r\n\r\naGVsbG8=',
    ])
  })

  it('does not duplicate an explicitly configured transfer header', () => {
    expect(
      buildMultipart(
        ['aGVsbG8='],
        'multipart/mixed',
        {
          itemEncoding: {
            headers: { 'content-transfer-encoding': { schema: { type: 'string', const: 'base64' } } },
          },
        },
        { type: 'array', items: { type: 'string', contentEncoding: 'base64' } },
      ),
    ).toStrictEqual([
      {
        type: 'text',
        value: 'aGVsbG8=',
        contentType: 'application/octet-stream',
        headers: { 'content-transfer-encoding': 'base64' },
      },
    ])
  })

  it('keeps a positional data property named isDisabled', () => {
    expect(
      buildRequestBody({
        content: {
          'multipart/form-data': {
            examples: { default: { value: [{ isDisabled: true }, { tag: 'next' }] } },
            prefixEncoding: [{ contentType: 'application/json' }],
            itemEncoding: { contentType: 'text/plain' },
          },
        },
      }),
    ).toStrictEqual({
      mode: 'multipart',
      contentType: 'multipart/form-data',
      value: [
        { key: 'isDisabled', type: 'text', value: 'true', contentType: 'application/json' },
        { key: 'tag', type: 'text', value: 'next', contentType: 'text/plain' },
      ],
    })
  })

  it('restores structured JSON in edited positional form rows', () => {
    expect(
      buildRequestBody({
        content: {
          'multipart/form-data': {
            schema: {
              type: 'array',
              prefixItems: [
                { type: 'object', properties: { data: { type: 'object', properties: { id: { type: 'integer' } } } } },
              ],
            },
            examples: { default: { value: [{ name: 'data', value: '{"id":1}' }] } },
            prefixEncoding: [{ contentType: 'application/json' }],
          },
        },
      }),
    ).toStrictEqual({
      mode: 'multipart',
      contentType: 'multipart/form-data',
      value: [{ type: 'text', key: 'data', contentType: 'application/json', value: '{"id":1}' }],
    })
  })

  it('regroups edited nested form rows before applying nested encoding', () => {
    expect(
      buildRequestBody({
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                details: { type: 'object', properties: { city: { type: 'string' }, count: { type: 'integer' } } },
              },
            },
            examples: {
              default: {
                value: [
                  { name: 'details.city', value: 'Paris' },
                  { name: 'details.count', value: '2' },
                ],
              },
            },
            encoding: {
              details: { contentType: 'multipart/form-data', encoding: { city: { contentType: 'application/json' } } },
            },
          },
        },
      }),
    ).toStrictEqual({
      mode: 'multipart',
      contentType: 'multipart/form-data',
      value: [
        {
          key: 'details',
          type: 'multipart',
          contentType: 'multipart/form-data',
          value: [
            { key: 'city', type: 'text', contentType: 'application/json', value: '"Paris"' },
            { key: 'count', type: 'text', contentType: 'text/plain', value: '2' },
          ],
        },
      ],
    })
  })

  it('repeats nested URL-encoded array fields while preserving nested array items as JSON', () => {
    expect(
      buildMultipart([{ tags: ['one', 'two'], matrix: [[1, 2], [3]] }], 'multipart/mixed', {
        itemEncoding: {
          contentType: 'application/x-www-form-urlencoded',
          encoding: { tags: { contentType: 'text/plain' } },
        },
      }),
    ).toStrictEqual([
      {
        type: 'text',
        contentType: 'application/x-www-form-urlencoded',
        value: 'tags=one&tags=two&matrix=%5B1%2C2%5D&matrix=%5B3%5D',
      },
    ])
  })

  it.each(['image/*', 'text/css,text/javascript,image/*'])(
    'selects a concrete file media type from %s',
    (contentType) => {
      const file = new File(['bytes'], 'image.png', { type: 'image/png' })
      expect(buildMultipart([file], 'multipart/mixed', { itemEncoding: { contentType } })).toStrictEqual([
        { type: 'file', value: file, contentType: 'image/png' },
      ])
    },
  )

  it('retains headers on every part produced by explicit form style', () => {
    expect(
      buildMultipart({ fields: { a: 1, b: 2 } }, 'multipart/form-data', {
        encoding: {
          fields: {
            style: 'form',
            headers: { 'Content-ID': { schema: { type: 'string', const: '<fields>' } } },
          },
        },
      }),
    ).toStrictEqual([
      { type: 'text', key: 'a', value: '1', headers: { 'Content-ID': '<fields>' } },
      { type: 'text', key: 'b', value: '2', headers: { 'Content-ID': '<fields>' } },
    ])
  })

  it('encodes nested URL forms using JSON defaults and explicit JSON media types', () => {
    expect(
      buildMultipart([{ address: { city: 'Paris' }, label: 'hello', tags: ['one', 'two'] }], 'multipart/mixed', {
        itemEncoding: {
          contentType: 'application/x-www-form-urlencoded',
          encoding: { label: { contentType: 'application/json' }, tags: { style: 'form', explode: true } },
        },
      }),
    ).toStrictEqual([
      {
        type: 'text',
        contentType: 'application/x-www-form-urlencoded',
        value: 'address=%7B%22city%22%3A%22Paris%22%7D&label=%22hello%22&tags=one&tags=two',
      },
    ])
  })

  it('uses positional defaults for mixed content without encoding fields', () => {
    expect(
      buildRequestBody({ content: { 'multipart/mixed': { examples: { default: { value: ['a', 2] } } } } }),
    ).toStrictEqual({
      mode: 'multipart',
      contentType: 'multipart/mixed',
      value: [
        { type: 'text', contentType: 'text/plain', value: 'a' },
        { type: 'text', contentType: 'text/plain', value: '2' },
      ],
    })
  })

  it('uses positional encoding with edited form rows', () => {
    expect(
      buildRequestBody({
        content: {
          'multipart/form-data': {
            examples: {
              default: {
                value: [
                  { name: 'tag', value: 'one' },
                  { name: 'tag', value: 'two' },
                ],
              },
            },
            prefixEncoding: [{ contentType: 'application/json' }],
            itemEncoding: { contentType: 'text/plain' },
          },
        },
      }),
    ).toStrictEqual({
      mode: 'multipart',
      contentType: 'multipart/form-data',
      value: [
        { key: 'tag', type: 'text', contentType: 'application/json', value: '"one"' },
        { key: 'tag', type: 'text', contentType: 'text/plain', value: 'two' },
      ],
    })
  })

  it('applies prefix encodings then item encoding without expanding nested arrays', async () => {
    const parts = buildMultipart([{ id: 1 }, ['a', 'b'], false, 0, ''], 'multipart/mixed', {
      prefixEncoding: [{ contentType: 'application/json' }],
      itemEncoding: { contentType: 'application/vnd.test+json' },
    })
    expect(await wireParts(encodeMultipartBody(parts, 'multipart/mixed'))).toStrictEqual([
      'Content-Type: application/json\r\n\r\n{"id":1}',
      'Content-Type: application/vnd.test+json\r\n\r\n["a","b"]',
      'Content-Type: application/vnd.test+json\r\n\r\nfalse',
      'Content-Type: application/vnd.test+json\r\n\r\n0',
      'Content-Type: application/vnd.test+json\r\n\r\n""',
    ])
  })

  it('ignores unused prefix entries and defaults uncovered items', () => {
    expect(
      buildMultipart(['a'], 'multipart/mixed', { prefixEncoding: [{}, { contentType: 'image/png' }] }),
    ).toStrictEqual([{ type: 'text', contentType: 'text/plain', value: 'a' }])
    expect(buildMultipart([1, { id: 2 }], 'multipart/mixed', { prefixEncoding: [{}] })).toStrictEqual([
      { type: 'text', contentType: 'text/plain', value: '1' },
      { type: 'text', contentType: 'application/json', value: '{"id":2}' },
    ])
    expect(buildMultipart([], 'multipart/mixed', { itemEncoding: { contentType: 'image/png' } })).toStrictEqual([])
  })

  it('uses schema positions independently of encoding positions', () => {
    expect(
      buildMultipart(
        ['first', 'second', 'third'],
        'multipart/mixed',
        { prefixEncoding: [{}] },
        {
          type: 'array',
          prefixItems: [{ type: 'string' }, { __scalar_: '' }],
          items: { type: 'string' },
        },
      ),
    ).toStrictEqual([
      { type: 'text', contentType: 'text/plain', value: 'first' },
      { type: 'text', contentType: 'application/octet-stream', value: 'second' },
      { type: 'text', contentType: 'text/plain', value: 'third' },
    ])
  })

  it('preserves ordered form names and repeated names', async () => {
    const parts = buildMultipart([{ tag: 'a' }, { data: [1, 2] }, { tag: 'b' }], 'multipart/form-data', {
      prefixEncoding: [{}, { contentType: 'application/json' }],
      itemEncoding: { contentType: 'text/plain' },
    })
    expect(await wireParts(encodeMultipartBody(parts))).toStrictEqual([
      'Content-Disposition: form-data; name="tag"\r\nContent-Type: text/plain\r\n\r\na',
      'Content-Disposition: form-data; name="data"\r\nContent-Type: application/json\r\n\r\n[1,2]',
      'Content-Disposition: form-data; name="tag"\r\nContent-Type: text/plain\r\n\r\nb',
    ])
  })

  it('encodes nested multipart with independent boundaries and resolves nested variables', async () => {
    const parts = buildMultipart(
      [
        [1, 2],
        ['{{name}}', new File([new Uint8Array([0, 255, 128])], 'image.png')],
      ],
      'multipart/mixed',
      {
        prefixEncoding: [
          {},
          {
            contentType: 'multipart/mixed',
            prefixEncoding: [{ contentType: 'text/plain' }],
            itemEncoding: { contentType: 'image/png' },
          },
        ],
      },
    )
    const body = encodeMultipartBody(parts, 'multipart/mixed', (value) => value.replace('{{name}}', 'Alice'))
    const wire = await body.text()
    const boundaries = [...wire.matchAll(/boundary="?([^";\r\n]+)/g)].map((match) => match[1])
    expect(boundaries.length).toBe(1)
    expect(body.type.includes(boundaries[0]!)).toBe(false)
    expect(wire).toContain('Content-Type: text/plain\r\n\r\nAlice\r\n')
    expect(wire).toContain('Content-Type: application/json\r\n\r\n[1,2]\r\n')
    expect(wire).not.toContain('Content-Disposition:')
    expect(
      Array.from(new Uint8Array(await body.arrayBuffer())).some(
        (byte, index, bytes) => byte === 0 && bytes[index + 1] === 255 && bytes[index + 2] === 128,
      ),
    ).toBe(true)
  })

  it('applies named nested encoding to each repeated property item', () => {
    expect(
      buildMultipart({ batches: [[1, 2], [3]] }, 'multipart/form-data', {
        encoding: { batches: { contentType: 'multipart/mixed', itemEncoding: { contentType: 'application/json' } } },
      }),
    ).toStrictEqual([
      {
        key: 'batches',
        type: 'multipart',
        contentType: 'multipart/mixed',
        value: [
          { type: 'text', contentType: 'application/json', value: '1' },
          { type: 'text', contentType: 'application/json', value: '2' },
        ],
      },
      {
        key: 'batches',
        type: 'multipart',
        contentType: 'multipart/mixed',
        value: [{ type: 'text', contentType: 'application/json', value: '3' }],
      },
    ])
  })

  it('supports nested named forms inside positional multipart', () => {
    expect(
      buildMultipart([{ tags: ['one', 'two'] }], 'multipart/mixed', {
        itemEncoding: { contentType: 'multipart/form-data', encoding: { tags: { contentType: 'application/json' } } },
      }),
    ).toStrictEqual([
      {
        type: 'multipart',
        contentType: 'multipart/form-data',
        value: [
          { key: 'tags', type: 'text', contentType: 'application/json', value: '"one"' },
          { key: 'tags', type: 'text', contentType: 'application/json', value: '"two"' },
        ],
      },
    ])
  })

  it('ignores form style fields for mixed parts and uses explicit headers', async () => {
    const parts = buildMultipart([{ id: 1 }], 'multipart/mixed', {
      itemEncoding: {
        style: 'form',
        explode: true,
        contentType: 'application/json',
        headers: {
          'Content-ID': { schema: { type: 'string', const: '<metadata>' } },
          'Content-Type': { schema: { type: 'string', const: 'bad' } },
        },
      },
    })
    expect(await wireParts(encodeMultipartBody(parts, 'multipart/mixed'))).toStrictEqual([
      'Content-Type: application/json\r\nContent-ID: <metadata>\r\n\r\n{"id":1}',
    ])
  })

  it('builds multipart from raw JSON editor values', () => {
    expect(
      buildRequestBody({
        content: {
          'multipart/mixed': {
            examples: { default: { value: '["a", "b"]' } },
            itemEncoding: { contentType: 'text/plain' },
          },
        },
      }),
    ).toStrictEqual({
      mode: 'multipart',
      contentType: 'multipart/mixed',
      value: [
        { type: 'text', contentType: 'text/plain', value: 'a' },
        { type: 'text', contentType: 'text/plain', value: 'b' },
      ],
    })
  })
})
