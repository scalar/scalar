import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, win32 } from 'node:path'

import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { describe, expect, it } from 'vitest'

import { isOpenApiDocument } from './schemas/type-guards'
import { WORKSPACE_FILE_NAME, createServerWorkspaceStore } from './server'

// Verify filenames against the references consumed by a static server, including Windows separators.
describe('server-chunks', () => {
  it('writes Windows-sensitive component and operation names to matching contained references', async () => {
    const directory = await fs.mkdtemp(join(tmpdir(), 'scalar-chunks-'))
    const name = '..\\document'
    const schemaName = '..\\..\\outside#fragment%2f'
    const operationPath = '/..\\..\\outside'
    const schema = { type: 'string' }

    try {
      const store = await createServerWorkspaceStore({
        mode: 'static',
        directory: relative(process.cwd(), directory),
        documents: [
          {
            name,
            document: {
              openapi: '3.1.0',
              info: { title: 'Paths', version: '1' },
              components: { schemas: { [schemaName]: schema } },
              paths: { [operationPath]: { get: { responses: { '200': { description: 'OK' } } } } },
            },
          },
        ],
      })
      await store.generateWorkspaceChunks()
      // Existing regular files remain valid destinations when regenerating the same workspace.
      await store.generateWorkspaceChunks()
      const workspace = store.getWorkspace()
      const document = workspace.documents[name]
      if (!isOpenApiDocument(document)) {
        throw new Error('Expected an OpenAPI document')
      }
      const schemaRef = getValueAtPath(document, ['components', 'schemas', schemaName, '$ref'])
      const operationRef = getValueAtPath(document, ['paths', operationPath, 'get', '$ref'])
      expect(typeof schemaRef).toBe('string')
      expect(typeof operationRef).toBe('string')
      if (typeof schemaRef !== 'string' || typeof operationRef !== 'string') {
        throw new Error('Expected static chunk references')
      }
      for (const ref of [schemaRef, operationRef]) {
        const path = ref.replace(/^\.\//, '').replace(/#$/, '')
        expect(path).not.toContain('\\')
        const windowsRelative = win32.relative('C:\\public', win32.resolve('C:\\public', path))
        expect(windowsRelative.startsWith('chunks\\')).toBe(true)
        expect(windowsRelative).not.toContain('..\\')
        const contents: unknown = JSON.parse(await fs.readFile(join(directory, path), 'utf8'))
        if (ref === schemaRef) {
          expect(contents).toStrictEqual(schema)
        }
      }
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })

  it.each([
    { path: WORKSPACE_FILE_NAME, type: 'file' },
    { path: 'chunks', type: 'dir' },
    { path: 'chunks/doc/components', type: 'dir' },
    { path: 'chunks/doc/components/schemas/User.json', type: 'file' },
    { path: 'chunks/doc/operations', type: 'dir' },
    { path: 'chunks/doc/operations/~1users/get.json', type: 'file' },
  ] as const)('rejects a pre-existing $type symlink at $path', async ({ path, type }) => {
    const fixture = await fs.mkdtemp(join(tmpdir(), 'scalar-chunk-symlink-'))
    const directory = join(fixture, 'output')
    const outside = join(fixture, 'outside')
    const destination = join(directory, path)

    try {
      await fs.mkdir(outside)
      const marker = join(outside, 'untouched.json')
      await fs.writeFile(marker, 'untouched')
      await fs.mkdir(dirname(destination), { recursive: true })
      await fs.symlink(type === 'dir' ? outside : marker, destination, type)
      const store = await createServerWorkspaceStore({
        mode: 'static',
        directory: relative(process.cwd(), directory),
        documents: [
          {
            name: 'doc',
            document: {
              openapi: '3.1.0',
              info: { title: 'Symlinks', version: '1' },
              components: { schemas: { User: { type: 'string' } } },
              paths: { '/users': { get: { responses: { '200': { description: 'OK' } } } } },
            },
          },
        ],
      })

      await expect(store.generateWorkspaceChunks()).rejects.toThrow('not symbolic links')
      expect(await fs.readFile(marker, 'utf8')).toBe('untouched')
      expect(await fs.readdir(outside)).toStrictEqual(['untouched.json'])
    } finally {
      await fs.rm(fixture, { recursive: true, force: true })
    }
  })

  it('rejects a dangling manifest symlink without creating its target', async () => {
    const fixture = await fs.mkdtemp(join(tmpdir(), 'scalar-chunk-dangling-'))
    const directory = join(fixture, 'output')
    const target = join(fixture, 'outside.json')

    try {
      await fs.mkdir(directory)
      await fs.symlink(target, join(directory, WORKSPACE_FILE_NAME), 'file')
      const store = await createServerWorkspaceStore({
        mode: 'static',
        directory: relative(process.cwd(), directory),
        documents: [],
      })

      await expect(store.generateWorkspaceChunks()).rejects.toThrow('not symbolic links')
      await expect(fs.lstat(target)).rejects.toHaveProperty('code', 'ENOENT')
    } finally {
      await fs.rm(fixture, { recursive: true, force: true })
    }
  })

  it('uses an intentionally symlinked output directory as the trusted root', async () => {
    const fixture = await fs.mkdtemp(join(tmpdir(), 'scalar-chunk-root-'))
    const directory = join(fixture, 'output')
    const target = join(fixture, 'real-output')

    try {
      await fs.mkdir(target)
      await fs.symlink(target, directory, 'dir')
      const store = await createServerWorkspaceStore({
        mode: 'static',
        directory: relative(process.cwd(), directory),
        documents: [],
      })

      await store.generateWorkspaceChunks()
      expect(JSON.parse(await fs.readFile(join(target, WORKSPACE_FILE_NAME), 'utf8'))).toStrictEqual({ documents: {} })
    } finally {
      await fs.rm(fixture, { recursive: true, force: true })
    }
  })
})
