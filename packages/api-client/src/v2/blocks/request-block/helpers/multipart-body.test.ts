import type { MediaTypeObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { assert, describe, expect, it } from 'vitest'
import { isProxy, reactive } from 'vue'

import { getMultipartBodyParts, parseMultipartBody, updateMultipartBodyPart } from './multipart-body'

describe('multipart-body', () => {
  it('accepts structured values and JSON examples while preserving raw wire examples', () => {
    expect(parseMultipartBody({ value: '["text", ""]' })).toStrictEqual(['text', ''])
    expect(parseMultipartBody({ dataValue: { attachment: '' } })).toStrictEqual({ attachment: '' })
    expect(parseMultipartBody({ value: ['fallback'], serializedValue: '["wire"]' })).toBeUndefined()
    expect(parseMultipartBody({ value: '--boundary\r\nraw' })).toBeUndefined()
    expect(parseMultipartBody({ value: 'null' })).toBeUndefined()
  })

  it('unwraps reactive examples before editing without wrapping sibling values', () => {
    const metadata = { title: 'Metadata' }
    const example = reactive({ value: [metadata, ''] })
    const parsed = parseMultipartBody(example)
    assert(Array.isArray(parsed))
    expect(parsed[0]).toBe(metadata)
    expect(isProxy(parsed[0])).toBe(false)
    const file = new File(['bytes'], 'file.txt')
    expect(updateMultipartBodyPart(parsed!, [1], file)).toStrictEqual([metadata, file])
    expect(example.value[1]).toBe('')
  })

  it('matches positional schemas independently of encoding prefix length', () => {
    const media: MediaTypeObject = {
      schema: {
        type: 'array',
        prefixItems: [{ type: 'object' }, { type: 'string' }, { __scalar_: '' }],
        items: { type: 'string', format: 'binary' },
      },
      prefixEncoding: [{ contentType: 'application/json' }],
      itemEncoding: { contentType: 'application/octet-stream' },
    }
    const parts = getMultipartBodyParts([{ title: 'Metadata' }, 'description', '', ''], media)
    expect(parts.map(({ path, canUpload, contentType }) => ({ path, canUpload, contentType }))).toStrictEqual([
      { path: [0], canUpload: false, contentType: 'application/json' },
      { path: [1], canUpload: true, contentType: 'application/octet-stream' },
      { path: [2], canUpload: true, contentType: 'application/octet-stream' },
      { path: [3], canUpload: true, contentType: 'application/octet-stream' },
    ])
    expect(parts[0]?.value).toStrictEqual({ title: 'Metadata' })
  })

  it('uses the selected composition at the schema item path', () => {
    const media: MediaTypeObject = {
      schema: {
        type: 'array',
        prefixItems: [{ __scalar_: '', oneOf: [{ type: 'string' }, { type: 'string', format: 'binary' }] }],
      },
    }
    expect(getMultipartBodyParts([''], media, { 'requestBody.prefixItems.0.oneOf': 0 })[0]?.canUpload).toBe(false)
    expect(getMultipartBodyParts([''], media, { 'requestBody.prefixItems.0.oneOf': 1 })[0]?.canUpload).toBe(true)
  })

  it('supports named repeated files and leaves JSON objects as individual parts', () => {
    const media: MediaTypeObject = {
      schema: {
        type: 'object',
        properties: {
          metadata: { type: 'object' },
          files: { type: 'array', items: { type: 'string', format: 'binary' } },
        },
      },
    }
    const parts = getMultipartBodyParts({ metadata: { id: 1 }, files: ['', ''] }, media)
    expect(parts.map(({ path, canUpload }) => ({ path, canUpload }))).toStrictEqual([
      { path: ['metadata'], canUpload: false },
      { path: ['files', 0], canUpload: true },
      { path: ['files', 1], canUpload: true },
    ])
  })

  it('edits nested multipart leaves without serializing sibling files or mutating examples', () => {
    const sibling = new File(['sibling bytes'], 'sibling.txt')
    const upload = new File(['new bytes'], 'new.txt')
    const original = [{ id: 1 }, ['', sibling]]
    const media: MediaTypeObject = {
      schema: { type: 'array', prefixItems: [{ type: 'object' }, { type: 'array', items: { __scalar_: '' } }] },
      prefixEncoding: [
        { contentType: 'application/json' },
        { contentType: 'multipart/related', itemEncoding: { contentType: 'text/plain' } },
      ],
    }
    expect(getMultipartBodyParts(original, media).map((part) => part.path)).toStrictEqual([[0], [1, 0], [1, 1]])
    const updated = updateMultipartBodyPart(original, [1, 0], upload)
    expect(updated).toStrictEqual([{ id: 1 }, [upload, sibling]])
    expect((updated as unknown[][])[1]?.[1]).toBe(sibling)
    expect(original[1]).toStrictEqual(['', sibling])
  })

  it('resolves typeless named properties and additionalProperties before allowing uploads', () => {
    const value = { label: 'text', attachment: '' }
    const media: MediaTypeObject = {
      schema: { __scalar_: '', properties: { label: { type: 'string' }, attachment: { __scalar_: '' } } },
    }
    expect(getMultipartBodyParts(value, media).map((part) => part.canUpload)).toStrictEqual([false, true])
    expect(
      getMultipartBodyParts({ count: 1 }, { schema: { type: 'object', additionalProperties: { type: 'integer' } } })[0]
        ?.canUpload,
    ).toBe(false)
  })

  it('provides an upload slot inside an empty nested multipart array', () => {
    const media: MediaTypeObject = {
      schema: { type: 'array', prefixItems: [{ type: 'array', items: { type: 'string', format: 'binary' } }] },
      prefixEncoding: [{ contentType: 'multipart/related' }],
    }
    const part = getMultipartBodyParts([[]], media)[0]
    expect(part?.path).toStrictEqual([0, 0])
    expect(part?.canUpload).toBe(true)
    const file = new File(['bytes'], 'file.txt')
    expect(updateMultipartBodyPart([[]], part!.path, file)).toStrictEqual([[file]])
    expect(
      getMultipartBodyParts([[]], {
        ...media,
        schema: { type: 'array', prefixItems: [{ type: 'array', maxItems: 0 }] },
      }),
    ).toStrictEqual([])
  })

  it('uses itemSchema and permits uploads for schemaless parts', () => {
    expect(getMultipartBodyParts([''], { itemSchema: { type: 'string', format: 'binary' } })[0]?.canUpload).toBe(true)
    expect(getMultipartBodyParts([''], { itemSchema: { type: 'string' } })[0]?.canUpload).toBe(false)
    expect(getMultipartBodyParts([''], {})[0]?.canUpload).toBe(true)
  })
})
