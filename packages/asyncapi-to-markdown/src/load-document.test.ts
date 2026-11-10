import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { createAsyncApiMarkdownRenderer, createMarkdownFromAsyncApi } from './index'
import { loadDocument } from './load-document'

const document = { asyncapi: '3.0.0', info: { title: 'Trusted API', version: '1' } }
const externalDocument = (ref: string): Record<string, unknown> => ({
  ...document,
  components: { schemas: { Secret: { $ref: ref } } },
})
const secret = { type: 'string', description: 'DiagnosticSecretMarker' }

describe('load-document', () => {
  it.each(['127.0.0.1', '[::1]', '169.254.169.254', '10.0.0.1'])(
    'blocks private URL inputs and references to %s',
    async (host) => {
      const url = `http://${host}/api.json`
      await expect(loadDocument(url)).rejects.toThrow('Failed to load AsyncAPI document')
      await expect(loadDocument(externalDocument(url))).rejects.toThrow('Failed to resolve')
    },
  )

  it('blocks loopback inputs and references before contact and permits explicit trusted access', async () => {
    const requests: string[] = []
    const server = createServer((request, response) => {
      requests.push(request.url ?? '')
      response.end(JSON.stringify(request.url === '/api.json' ? externalDocument('./secret.json') : secret))
    })
    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
      })
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Missing test server address')
      }
      const origin = `http://127.0.0.1:${address.port}`
      await expect(createMarkdownFromAsyncApi(`${origin}/api.json`)).rejects.toThrow('Failed to load')
      await expect(createMarkdownFromAsyncApi(externalDocument(`${origin}/secret.json`))).rejects.toThrow(
        'Failed to resolve',
      )
      expect(requests).toStrictEqual([])
      expect(
        await createMarkdownFromAsyncApi(`${origin}/api.json`, {
          model: 'Secret',
          documentLoading: { allowPrivateNetworks: true },
        }),
      ).toContain('DiagnosticSecretMarker')
      expect(requests).toStrictEqual(['/api.json', '/secret.json'])
      const renderer = await createAsyncApiMarkdownRenderer(externalDocument(`${origin}/secret.json`), {
        allowPrivateNetworks: true,
      })
      expect(await renderer.render({ model: 'Secret' })).toContain('DiagnosticSecretMarker')
      expect(requests).toStrictEqual(['/api.json', '/secret.json', '/secret.json'])
    } finally {
      server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

  it('requires file permission and confines input files, references, traversal, and symlinks', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'asyncapi-permissions-'))
    const approved = join(directory, 'approved')
    await mkdir(approved)
    const outside = join(directory, 'outside.json')
    const inside = join(approved, 'api.json')
    const link = join(approved, 'link.json')
    try {
      await writeFile(outside, JSON.stringify(document))
      await writeFile(inside, JSON.stringify(externalDocument('./secret.json')))
      await writeFile(join(approved, 'secret.json'), JSON.stringify(secret))
      await symlink(outside, link)
      await expect(createMarkdownFromAsyncApi(inside)).rejects.toThrow('explicit basePath')
      await expect(createMarkdownFromAsyncApi(externalDocument(outside))).rejects.toThrow('Failed to resolve')
      for (const path of [outside, join(approved, '../outside.json'), link]) {
        await expect(loadDocument(path, { basePath: approved })).rejects.toThrow('Failed to load')
        await expect(loadDocument(externalDocument(path), { basePath: approved })).rejects.toThrow('Failed to resolve')
      }
      const renderer = await createAsyncApiMarkdownRenderer(inside, { basePath: approved })
      expect(await renderer.render({ model: 'Secret' })).toContain('DiagnosticSecretMarker')
      expect(
        await createMarkdownFromAsyncApi(inside, { model: 'Secret', documentLoading: { basePath: approved } }),
      ).toContain('DiagnosticSecretMarker')
      // A permitted reference must not grant its own references broader access.
      await writeFile(join(approved, 'secret.json'), JSON.stringify({ $ref: '../outside.json' }))
      await expect(loadDocument(inside, { basePath: approved })).rejects.toThrow('Failed to resolve')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
