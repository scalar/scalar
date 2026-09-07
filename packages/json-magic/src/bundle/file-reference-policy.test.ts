import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { type LoaderPlugin, bundle } from './bundle'
import { readFiles } from './plugins/read-files'

const directories: string[] = []

const createFixture = async (): Promise<{ directory: string; file: string }> => {
  const directory = await mkdtemp(join(tmpdir(), 'scalar-file-policy-'))
  directories.push(directory)
  const file = join(directory, 'allowed.json')
  await writeFile(file, JSON.stringify({ type: 'string', description: 'local-fixture-marker' }))
  return { directory, file }
}

// Controlled loader data exercises remote provenance without relying on external network services.
const remoteLoader = (documents: Record<string, unknown>): LoaderPlugin => ({
  type: 'loader',
  validate: (value) => Object.hasOwn(documents, value),
  exec: (value) => Promise.resolve({ ok: true, data: documents[value], raw: JSON.stringify(documents[value]) }),
})

describe('file-reference-policy', () => {
  afterEach(async () => {
    await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
  })

  it('blocks a remote root from reading a local file after changing its base with $id', async () => {
    const { directory, file } = await createFixture()
    const url = 'https://example.com/api.json'
    const result = await bundle(url, {
      blockRemoteFileReferences: true,
      plugins: [
        remoteLoader({ [url]: { $id: join(directory, 'remote.json'), properties: { local: { $ref: file } } } }),
        readFiles({ basePath: directory }),
      ],
      treeShake: false,
    })

    expect(JSON.stringify(result)).not.toContain('local-fixture-marker')
    expect(result).toMatchObject({ properties: { local: { $ref: file } } })
  })

  it.each([false, true])(
    'keeps remote provenance when a local description loads a remote chunk (%s)',
    async (global) => {
      const { directory, file } = await createFixture()
      const url = 'https://example.com/schema.json'
      const remote = {
        $id: join(directory, 'remote.json'),
        title: 'remote-holder',
        properties: { local: { $ref: file } },
      }
      const result = await bundle(
        { remote: { $ref: url, $global: global } },
        {
          origin: join(directory, 'api.json'),
          blockRemoteFileReferences: true,
          plugins: [remoteLoader({ [url]: remote }), readFiles({ basePath: directory })],
          treeShake: false,
        },
      )

      expect(JSON.stringify(result)).not.toContain('local-fixture-marker')
      expect(remote.properties.local.$ref).toBe(file)
    },
  )

  it('checks permissions before reusing a file cached by a trusted local reference', async () => {
    const { directory, file } = await createFixture()
    const url = 'https://example.com/schema.json'
    const remote = { $id: join(directory, 'remote.json'), properties: { local: { $ref: file } } }
    const result = await bundle(
      { local: { $ref: file }, remote: { $ref: url } },
      {
        origin: join(directory, 'api.json'),
        blockRemoteFileReferences: true,
        plugins: [remoteLoader({ [url]: remote }), readFiles({ basePath: directory })],
        treeShake: false,
      },
    )

    expect(JSON.stringify(result)).toContain('local-fixture-marker')
    expect(remote.properties.local.$ref).toBe(file)
  })

  it('keeps URL input remote when the caller supplies a local origin', async () => {
    const { directory, file } = await createFixture()
    const url = 'https://example.com/api.json'
    const result = await bundle(url, {
      origin: join(directory, 'api.json'),
      blockRemoteFileReferences: true,
      plugins: [remoteLoader({ [url]: { properties: { local: { $ref: file } } } }), readFiles({ basePath: directory })],
      treeShake: false,
    })

    expect(JSON.stringify(result)).not.toContain('local-fixture-marker')
    expect(result).toMatchObject({ properties: { local: { $ref: file } } })
  })

  it('allows remote documents to resolve other remote documents', async () => {
    const url = 'https://example.com/api.json'
    const result = await bundle(url, {
      blockRemoteFileReferences: true,
      plugins: [
        remoteLoader({
          [url]: { properties: { remote: { $ref: './schema.json' } } },
          'https://example.com/schema.json': { type: 'string', description: 'remote-fixture-marker' },
        }),
      ],
      treeShake: false,
    })

    expect(JSON.stringify(result)).toContain('remote-fixture-marker')
  })
})
