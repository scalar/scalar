import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'

import { nodeUndici } from './undici'

describe('nodeUndici', () => {
  it.each([false, true])(
    'uploads binary files from a fresh Node process with typed=%s',
    async (typed) => {
      const directory = await mkdtemp(join(tmpdir(), 'scalar-undici-upload-'))
      const bytes = [new Uint8Array([0, 255, 128, 13, 10]), new Uint8Array([254, 1, 0])]
      const received: Buffer[] = []
      const headers: Record<string, string> = {}
      const server = createServer((request, response) => {
        headers['Content-Type'] = String(request.headers['content-type'])
        request.on('data', (chunk: Buffer) => received.push(chunk))
        request.on('end', () => response.end('{}'))
      })
      try {
        await writeFile(join(directory, 'payload.bin'), bytes[0]!)
        await writeFile(join(directory, 'second.bin'), bytes[1]!)
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
        const address = server.address()
        if (!address || typeof address === 'string') {
          throw new Error('Expected a local server address')
        }
        const snippet = nodeUndici.generate({
          url: `http://127.0.0.1:${address.port}/`,
          method: 'POST',
          headers: [{ name: 'content-type', value: 'multipart/form-data' }],
          postData: {
            mimeType: 'multipart/form-data',
            params: [
              {
                name: 'upload',
                fileName: 'payload.bin',
                value: '@payload.bin',
                contentType: 'application/octet-stream',
              },
              { name: 'upload', fileName: 'second.bin', value: '@second.bin', contentType: 'application/octet-stream' },
              { name: 'note', value: '@scalar', ...(typed ? { contentType: 'text/plain' } : {}) },
            ],
          },
        })
        // Resolve the installed dependency before running from the temporary payload directory.
        const undici = import.meta.resolve('undici')
        const source =
          snippet.replace("from 'undici'", `from ${JSON.stringify(undici)}`) +
          `\nawait body.dump();\nawait (await import(${JSON.stringify(undici)})).getGlobalDispatcher().destroy();`
        await promisify(execFile)(process.execPath, ['--input-type=module', '-e', source], {
          cwd: directory,
          timeout: 10000,
        })
        const parsed = await new Response(Buffer.concat(received), { headers }).formData()
        const files = parsed.getAll('upload')
        expect(files.length).toBe(2)
        for (const [index, file] of files.entries()) {
          if (!(file instanceof File)) {
            throw new Error('Expected a file part')
          }
          expect(file.name).toBe(index === 0 ? 'payload.bin' : 'second.bin')
          expect(new Uint8Array(await file.arrayBuffer())).toStrictEqual(bytes[index])
        }
        expect(parsed.get('note')).toBe('@scalar')
      } finally {
        server.closeAllConnections()
        await new Promise<void>((resolve) => server.close(() => resolve()))
        await rm(directory, { recursive: true, force: true })
      }
    },
    15000,
  )

  it('has import', () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
    })

    expect(result).toContain(`import { request } from 'undici'`)
  })

  it('returns a basic request', () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com')`)
  })

  it('returns a POST request', () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com', {
  method: 'POST'
})`)
  })

  it('has headers', () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com', {
  headers: {
    'Content-Type': 'application/json'
  }
})`)
  })

  it(`doesn't add empty headers`, () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com')`)
  })

  it('has JSON body', () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          hello: 'world',
        }),
      },
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com', {
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    hello: 'world'
  })
})`)
  })

  it('preserves nested arrays and escapes strings in a top-level array body', () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify([[1, 2], [], ["it's", 'a\\b\nc']]),
      },
    })

    expect(result).toBe(String.raw`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com', {
  method: 'POST',
  body: JSON.stringify([[1, 2], [], ['it\'s', 'a\\b\nc']])
})`)
  })

  it('has query string', () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'bar',
          value: 'foo',
        },
      ],
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com?foo=bar&bar=foo')`)
  })

  it('has cookies', () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'bar',
          value: 'foo',
        },
      ],
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com', {
  headers: {
    'Set-Cookie': 'foo=bar; bar=foo'
  }
})`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com')`)
  })
})
