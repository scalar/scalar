import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { createMarkdownFromOpenApi, createOpenApiMarkdownRenderer } from './create-markdown-from-openapi'
import { loadDocument } from './load-document'

const document = { openapi: '3.1.1', info: { title: 'Trusted API', version: '1' }, paths: {} }
const referencing = (ref: string): Record<string, unknown> => ({
  ...document,
  components: { schemas: { Secret: { $ref: ref } } },
})

describe('load-document-security', () => {
  it.each(['127.0.0.1', '[::1]', '169.254.169.254', '10.0.0.1'])(
    'blocks private URL inputs and references to %s',
    async (host) => {
      const url = `http://${host}/openapi.json`
      await expect(loadDocument(url)).rejects.toThrow('Failed to load OpenAPI document')
      await expect(loadDocument(referencing(url))).rejects.toThrow('Failed to resolve')
    },
  )

  it('requires an approved directory and confines initial and referenced files, including symlinks', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'markdown-permissions-'))
    const approved = join(directory, 'approved')
    await mkdir(approved)
    const outside = join(directory, 'outside.json')
    const inside = join(approved, 'inside.json')
    const link = join(approved, 'link.json')
    try {
      await writeFile(outside, JSON.stringify(document))
      await writeFile(inside, JSON.stringify(document))
      await symlink(outside, link)
      await expect(loadDocument(inside)).rejects.toThrow('explicit basePath')
      await expect(loadDocument(referencing(inside))).rejects.toThrow('Failed to resolve')
      for (const path of [outside, join(approved, '../outside.json'), link]) {
        await expect(loadDocument(path, { basePath: approved })).rejects.toThrow('Failed to load')
        await expect(loadDocument(referencing(path), { basePath: approved })).rejects.toThrow('Failed to resolve')
      }
      const renderer = await createOpenApiMarkdownRenderer(inside, { basePath: approved })
      expect(await renderer.render()).toContain('Trusted API')
      expect(await createMarkdownFromOpenApi(inside, { documentLoading: { basePath: approved } })).toContain(
        'Trusted API',
      )
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('blocks loopback without contacting it and permits explicit trusted network access', async () => {
    const requests: string[] = []
    const server = createServer((request, response) => {
      requests.push(request.url ?? '')
      response.end(JSON.stringify(document))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    try {
      const address = server.address()
      if (address === null || typeof address === 'string') {
        throw new Error('Missing test server address')
      }
      const url = `http://127.0.0.1:${address.port}/openapi.json`
      await expect(createMarkdownFromOpenApi(url)).rejects.toThrow('Failed to load')
      expect(requests).toStrictEqual([])
      expect(await createMarkdownFromOpenApi(url, { documentLoading: { allowPrivateNetworks: true } })).toContain(
        'Trusted API',
      )
      expect(requests).toStrictEqual(['/openapi.json'])
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    }
  })
})
