import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { createServerWorkspaceStore } from './server'

const document = { openapi: '3.2.0', info: { title: 'Trusted API', version: '1' }, paths: {} }

describe('server-security', () => {
  it('blocks private initial URLs, later additions, and external references without contacting them', async () => {
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
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: '/docs',
        documents: [{ name: 'blocked', url }],
      })
      await store.addDocument({ name: 'also-blocked', url })
      expect(Object.keys(store.getWorkspace().documents)).toStrictEqual([])
      await store.addDocument({
        name: 'external',
        document: {
          ...document,
          paths: { '/external': { $ref: url } },
          components: { securitySchemes: { external: { $ref: `${url}#/components/securitySchemes/auth` } } },
        },
      })
      expect(requests).toStrictEqual([])

      const trusted = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: '/docs',
        documents: [{ name: 'trusted', url }],
        documentLoading: { allowPrivateNetworks: true },
      })
      expect(Object.keys(trusted.getWorkspace().documents)).toStrictEqual(['trusted'])
      expect(requests).toStrictEqual(['/openapi.json'])
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    }
  })

  it('requires an approved directory and rejects traversal and symlinks for initial and added files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'workspace-permissions-'))
    const approved = join(directory, 'approved')
    await mkdir(approved)
    const outside = join(directory, 'outside.json')
    const inside = join(approved, 'inside.json')
    const link = join(approved, 'link.json')
    try {
      await writeFile(
        outside,
        JSON.stringify({ ...document, paths: { '/private': { get: { summary: 'Confidential operation' } } } }),
      )
      await writeFile(inside, JSON.stringify(document))
      await symlink(outside, link)
      const disabled = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: '/docs',
        documents: [{ name: 'disabled', path: inside }],
      })
      expect(Object.keys(disabled.getWorkspace().documents)).toStrictEqual([])
      const store = await createServerWorkspaceStore({
        mode: 'ssr',
        baseUrl: '/docs',
        documents: [
          { name: 'inside', path: inside },
          { name: 'outside', path: outside },
        ],
        documentLoading: { basePath: approved },
      })
      for (const path of [outside, join(approved, '../outside.json'), link]) {
        await store.addDocument({ name: 'blocked', path })
      }
      expect(Object.keys(store.getWorkspace().documents)).toStrictEqual(['inside'])
      for (const path of [outside, link]) {
        await store.addDocument({
          name: 'external',
          document: {
            ...document,
            paths: { '/leak': { $ref: `${path}#/paths/~1private` } },
          },
        })
        expect(JSON.stringify(store.getWorkspace())).not.toContain('Confidential operation')
      }
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
