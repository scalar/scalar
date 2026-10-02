import { readFileSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { clients } from '../clients'
import { buildFormData } from './form-data'

const javascriptPlugins = clients
  .filter(({ key }) => key === 'js' || key === 'node')
  .flatMap(({ key, clients: plugins }) => plugins.map((plugin) => ({ target: key, client: plugin.client, plugin })))

describe('form-data', () => {
  it.each(javascriptPlugins)('serializes actual binary bytes in $target/$client output', async ({ client, plugin }) => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-upload-'))
    const first = join(directory, "first'file.bin")
    const second = join(directory, 'second.bin')
    const bytes = [new Uint8Array([0, 255, 128, 13, 10]), new Uint8Array([254, 1, 0])]
    try {
      await writeFile(first, bytes[0]!)
      await writeFile(second, bytes[1]!)
      const snippet = plugin.generate({
        url: 'https://api.example.invalid/upload/',
        method: 'POST',
        headers: [{ name: 'CONTENT-TYPE', value: 'multipart/form-data' }],
        postData: {
          mimeType: 'multipart/form-data',
          params: [
            { name: 'upload', fileName: first, value: `@${first}`, contentType: 'application/octet-stream' },
            { name: 'upload', fileName: second, value: `@${second}`, contentType: 'application/octet-stream' },
            { name: 'note', value: '@scalar' },
            { name: 'note', value: 'こんにちは\ntext' },
            { name: 'empty', value: '' },
          ],
        },
      })
      expect(snippet.includes('CONTENT-TYPE')).toBe(false)
      const bodyBinding: Record<string, string> = {
        axios: 'data: formData',
        fetch: 'body: formData',
        ofetch: 'body: formData',
        undici: 'body: formData',
        jquery: 'data: body',
        xhr: 'xhr.send(body);',
      }
      expect(snippet).toContain(bodyBinding[client]!)
      const end =
        client === 'axios'
          ? 'const options'
          : client === 'xhr'
            ? 'const xhr'
            : client === 'jquery'
              ? '$.ajax'
              : client === 'undici'
                ? 'const { statusCode'
                : `${client}(`
      // Execute the generated setup. File selection is the documented browser precondition;
      // Node file reads use real files. Network execution is outside this serialization test.
      const setup = snippet
        .slice(0, snippet.indexOf(end))
        .split('\n')
        .filter((line) => !line.startsWith('import ') && !line.startsWith('const files ='))
        .join('\n')
      const variable = client === 'xhr' || client === 'jquery' ? 'body' : 'formData'
      const selected = bytes.map((data, index) => new File([data], `selected-${index}.bin`))
      const body: FormData = new Function('files', 'readFileSync', `${setup}\nreturn ${variable};`)(
        selected,
        readFileSync,
      )
      const parsed = await new Response(body).formData()
      const uploads = parsed.getAll('upload')
      expect(uploads.length).toBe(2)
      for (const [index, upload] of uploads.entries()) {
        if (!(upload instanceof File)) throw new Error('Expected a file upload')
        expect(upload.name).toBe(index === 0 ? first : second)
        expect(upload.type).toBe('application/octet-stream')
        expect(new Uint8Array(await upload.arrayBuffer())).toStrictEqual(bytes[index])
      }
      expect(parsed.getAll('note')).toStrictEqual(['@scalar', 'こんにちは\r\ntext'])
      expect(parsed.get('empty')).toBe('')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('preserves authored inline file contents in browser examples', async () => {
    const setup = buildFormData(
      [{ name: 'upload', fileName: 'inline.txt', value: 'contents', contentType: 'text/plain' }],
      'js',
    )
    const body: FormData = new Function(`${setup.join('\n')}\nreturn formData;`)()
    const file = body.get('upload')
    if (!(file instanceof File)) throw new Error('Expected a file upload')
    expect(file.name).toBe('inline.txt')
    expect(await file.text()).toBe('contents')
  })
})
