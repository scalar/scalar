import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, win32 } from 'node:path'

import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { describe, expect, it } from 'vitest'

import { isOpenApiDocument } from './schemas/type-guards'
import { createServerWorkspaceStore } from './server'

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
})
