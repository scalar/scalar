import { describe, expect, it, vi } from 'vitest'

import type { MultipartPart } from './build-multipart'
import { encodeMultipartBody } from './encode-multipart-body'

describe('encode-multipart-body', () => {
  it('regenerates a boundary that occurs in resolved part content', async () => {
    const collision = `----scalar-${'00'.repeat(24)}`
    const random = vi
      .spyOn(crypto, 'getRandomValues')
      .mockReturnValueOnce(new Uint8Array(24))
      .mockReturnValueOnce(new Uint8Array(24).fill(1))
    try {
      const body = encodeMultipartBody(
        [{ type: 'text', key: 'value', value: '{{value}}' }],
        'multipart/form-data',
        (value) => value.replace('{{value}}', `before\r\n--${collision}\r\nafter`),
      )
      expect(body.type).toBe(`multipart/form-data; boundary=----scalar-${'01'.repeat(24)}`)
      const form = await new Response(body, { headers: { 'content-type': body.type } }).formData()
      expect(form.get('value')).toBe(`before\r\n--${collision}\r\nafter`)
    } finally {
      random.mockRestore()
    }
  })

  it('regenerates an enclosing boundary that matches a nested delimiter', async () => {
    const random = vi
      .spyOn(crypto, 'getRandomValues')
      .mockReturnValueOnce(new Uint8Array(24))
      .mockReturnValueOnce(new Uint8Array(24))
      .mockReturnValueOnce(new Uint8Array(24).fill(1))
    try {
      const body = encodeMultipartBody([
        {
          type: 'multipart',
          key: 'nested',
          contentType: 'multipart/form-data',
          value: [{ type: 'text', key: 'value', value: 'leaf' }],
        },
      ])
      expect(body.type).toBe(`multipart/form-data; boundary=----scalar-${'01'.repeat(24)}`)
      expect(await body.text()).toContain(`Content-Type: multipart/form-data; boundary=----scalar-${'00'.repeat(24)}`)
    } finally {
      random.mockRestore()
    }
  })

  it('fails instead of looping forever when random boundaries keep colliding', () => {
    const collision = `----scalar-${'00'.repeat(24)}`
    const random = vi.spyOn(crypto, 'getRandomValues').mockReturnValue(new Uint8Array(24))
    try {
      expect(() => encodeMultipartBody([{ type: 'text', value: collision }])).toThrow(
        'Unable to generate a distinct multipart boundary',
      )
    } finally {
      random.mockRestore()
    }
  })

  it('keeps every nesting boundary distinct and preserves invalid UTF-8 file bytes', async () => {
    const bytes = new Uint8Array([0, 255, 254, 128, 192, 13, 10])
    const parts = Array.from({ length: 7 }).reduce<MultipartPart[]>(
      (value) => [{ type: 'multipart', key: 'nested', contentType: 'multipart/form-data', value }],
      [{ type: 'file', key: 'upload', value: new File([bytes], 'data.bin') }],
    )
    const body = encodeMultipartBody(parts)
    const boundaries = [body.type, await body.text()].flatMap((text) =>
      [...text.matchAll(/boundary="?([^";\r\n]+)/g)].map((match) => match[1]!),
    )
    expect(boundaries.length).toBe(8)
    expect(new Set(boundaries).size).toBe(8)
    for (const [index, boundary] of boundaries.entries()) {
      expect(boundaries.some((other, otherIndex) => otherIndex !== index && other.startsWith(boundary))).toBe(false)
    }
    const wire = new Uint8Array(await body.arrayBuffer())
    const start = new TextEncoder().encode(
      `Content-Disposition: form-data; name="upload"; filename="data.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`,
    )
    const offset = Buffer.from(wire).indexOf(start)
    expect(offset).toBeGreaterThan(-1)
    expect(wire.slice(offset + start.length, offset + start.length + bytes.length)).toStrictEqual(bytes)
    expect(new TextDecoder().decode(wire.slice(offset + start.length + bytes.length))).toBe(
      [...boundaries]
        .reverse()
        .map((boundary) => `\r\n--${boundary}--\r\n`)
        .join(''),
    )
  })

  it('accepts eight multipart levels and rejects a ninth', async () => {
    const parts = Array.from({ length: 7 }).reduce<MultipartPart[]>(
      (value) => [{ type: 'multipart', contentType: 'multipart/mixed', value }],
      [{ type: 'text', value: 'leaf' }],
    )
    expect(await encodeMultipartBody(parts, 'multipart/mixed').text()).toContain('leaf\r\n')
    expect(() => encodeMultipartBody([{ type: 'multipart', contentType: 'multipart/mixed', value: parts }])).toThrow(
      'Maximum multipart nesting exceeded',
    )
  })

  it('rejects cyclic multipart parts', () => {
    const parts: MultipartPart[] = []
    parts.push({ type: 'multipart', contentType: 'multipart/mixed', value: parts })
    expect(() => encodeMultipartBody(parts)).toThrow('Maximum multipart nesting exceeded')
  })

  it('rejects nested header injection after environment replacement', () => {
    expect(() =>
      encodeMultipartBody(
        [
          {
            type: 'multipart',
            contentType: 'multipart/mixed',
            value: [{ type: 'text', value: 'safe', headers: { 'Content-ID': '{{id}}' } }],
          },
        ],
        'multipart/mixed',
        () => 'id\r\nInjected: yes',
      ),
    ).toThrow('Invalid multipart header')
  })

  it('replaces supplied boundaries while preserving other media type parameters', async () => {
    const body = encodeMultipartBody(
      [{ type: 'text', value: 'html', contentType: 'text/html' }],
      'multipart/related; type="text/html"; boundary=old',
    )
    expect(body.type).toContain('type="text/html"')
    expect(body.type).not.toContain('boundary=old')
    const boundary = body.type.match(/boundary="?([^";]+)/)?.[1]
    expect(await body.text()).toBe(
      '--' + boundary + '\r\nContent-Type: text/html\r\n\r\nhtml\r\n--' + boundary + '--\r\n',
    )
  })

  it('sends JSON as fields and preserves binary files, repeated names, and empty values', async () => {
    const bytes = new Uint8Array([0, 255, 13, 10, 128])
    const body = encodeMultipartBody([
      { type: 'text', key: 'data', value: '{"id":1}', contentType: 'application/json' },
      { type: 'text', key: 'data', value: '{"id":2}', contentType: 'application/json' },
      { type: 'text', key: 'empty', value: '' },
      { type: 'text', key: 'unicode', value: 'こんにちは' },
      { type: 'file', key: 'upload', value: new File([bytes], 'data.bin') },
    ])
    const response = new Response(body, { headers: { 'content-type': body.type } })
    const wire = await response.clone().text()
    expect(wire).toContain('name="data"\r\nContent-Type: application/json\r\n\r\n{"id":1}')
    expect(wire).not.toContain('filename="blob"')
    const form = await response.formData()
    expect(form.getAll('data')).toEqual(['{"id":1}', '{"id":2}'])
    expect(form.get('empty')).toBe('')
    expect(form.get('unicode')).toBe('こんにちは')
    const file = form.get('upload')
    if (!(file instanceof File)) {
      throw new Error('Expected an uploaded file')
    }
    expect(file.name).toBe('data.bin')
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(bytes)
  })

  it('escapes names and filenames without injecting headers', async () => {
    const body = encodeMultipartBody([
      { type: 'text', key: 'a"\r\nInjected: yes', value: 'safe', contentType: 'application/json' },
      { type: 'file', key: 'upload', value: new File(['bytes'], 'a"\nfile.txt') },
    ])
    const wire = await body.text()
    expect(wire).toContain('name="a%22%0D%0AInjected: yes"')
    expect(wire).toContain('filename="a%22%0D%0Afile.txt"')
    expect(wire).not.toContain('\r\nInjected:')
  })

  it('rejects content types containing header delimiters', () => {
    expect(() =>
      encodeMultipartBody([
        { type: 'text', key: 'data', value: '{}', contentType: 'application/json\r\nInjected: yes' },
      ]),
    ).toThrow('Invalid multipart content type')
  })
  it('normalizes ordinary text line endings while preserving explicitly typed text', async () => {
    const body = encodeMultipartBody([
      { type: 'text', key: 'ordinary', value: 'a\nb\rc\r\nd' },
      { type: 'text', key: 'typed', value: 'a\nb', contentType: 'text/plain' },
    ])
    const form = await new Response(body, { headers: { 'content-type': body.type } }).formData()
    expect(form.get('ordinary')).toBe('a\r\nb\r\nc\r\nd')
    expect(form.get('typed')).toBe('a\nb')
  })
})
