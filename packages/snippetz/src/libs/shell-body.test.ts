import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { clients } from '../clients'

const plugins = clients.find(({ key }) => key === 'shell')!.clients

describe('shell-body', () => {
  it.each(plugins)('serializes binary uploads and typed literal text for $client', async (plugin) => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-shell-upload-'))
    const filename = "test;file,'name.bin"
    const bytes = new Uint8Array([
      0,
      255,
      128,
      13,
      10,
      ...new TextEncoder().encode(
        'before\r\n--scalar-boundary\r\nContent-Disposition: form-data; name="extra"\r\n\r\nafter',
      ),
    ])
    try {
      await writeFile(join(directory, filename), bytes)
      const snippet = plugin.generate({
        url: 'https://api.example.invalid/',
        method: 'POST',
        postData: {
          mimeType: 'multipart/form-data',
          params: [
            { name: 'upload', fileName: filename, value: `@${filename}`, contentType: 'application/octet-stream' },
            { name: 'note', value: '@scalar', contentType: 'text/plain' },
            { name: 'note', value: '<literal', contentType: 'text/plain' },
            { name: 'note', value: 'a;type=application/json', contentType: 'text/plain' },
            { name: 'empty', value: '' },
            { name: 'a=b', value: 'equals' },
            { name: 'a;b', value: 'semicolon' },
          ],
        },
      })
      expect(snippet).toContain('od -An -N16 -tx1 /dev/urandom')
      expect(snippet).toContain('\"$boundary\"')
      const source =
        plugin.client === 'wget'
          ? `${snippet.slice(0, snippet.indexOf('wget --quiet'))}cat "$multipart_body"`
          : snippet.slice(0, snippet.indexOf('} | ')) + '}'
      const body = execFileSync('sh', ['-c', source], { cwd: directory })
      const boundary = body.toString('utf8').split('\r\n')[0]?.slice(2)
      const parsed = await new Response(body, {
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      }).formData()
      const upload = parsed.get('upload')
      if (!(upload instanceof File)) {
        throw new Error('Expected a binary file part')
      }
      expect(upload.name).toBe(filename)
      expect(upload.type).toBe('application/octet-stream')
      expect(new Uint8Array(await upload.arrayBuffer())).toStrictEqual(bytes)
      expect(parsed.getAll('note')).toStrictEqual(['@scalar', '<literal', 'a;type=application/json'])
      expect(parsed.get('empty')).toBe('')
      expect(parsed.get('a=b')).toBe('equals')
      expect(parsed.get('a;b')).toBe('semicolon')
      if (plugin.client === 'wget') {
        expect(snippet).toContain('--body-file="$multipart_body"')
        expect(snippet.includes('--body-data')).toBe(false)
      } else if (plugin.client === 'curl') {
        expect(snippet).toContain('--data-binary @-')
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
