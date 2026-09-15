import { createServer } from 'node:http'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { fetchUrls } from '@/plugins/fetch-urls/fetch-urls'
import { readFiles } from '@/plugins/read-files/read-files'
import { load } from '@/utils/load/load'
import { resolveReferences } from '@/utils/resolve-references'

import pointers from './pointers.json'
import specification from './specification.json'

const filename = fileURLToPath(new URL('./pointers.json', import.meta.url))
const expected = {
  valid: true,
  errors: [],
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      alias: { type: 'string', minLength: 1, description: 'An alternate name' },
    },
    $defs: { nonEmptyString: { type: 'string', minLength: 1 } },
  },
}

describe('one-file', () => {
  it.each([
    { label: 'relative path', path: relative(process.cwd(), filename) },
    { label: 'absolute path', path: filename },
  ])('resolves internal references loaded from a $label', async ({ path }) => {
    const loaded = await load(path, { plugins: [readFiles()] })

    expect(loaded.errors).toStrictEqual([])
    expect(resolveReferences(loaded.filesystem)).toStrictEqual(expected)
  })

  it('resolves internal references loaded from a URL', async () => {
    const server = createServer((_request, response) => {
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify(pointers))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

    try {
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a TCP server address')
      }
      const loaded = await load(`http://127.0.0.1:${address.port}/pointers.json`, { plugins: [fetchUrls()] })

      expect(loaded.errors).toStrictEqual([])
      expect(resolveReferences(loaded.filesystem)).toStrictEqual(expected)
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    }
  })

  it('resolves the original fixture pointers and reports its unsupported resource names', () => {
    // Named $id/$anchor resolution is a separate resolver feature. Keep this original
    // fixture covered without treating unresolved names as a successfully resolved document.
    const result = resolveReferences(specification)

    expect(result.valid).toBe(false)
    expect(result.errors).toStrictEqual([
      { code: 'EXTERNAL_REFERENCE_NOT_FOUND', message: "Can't resolve external reference: non-empty-string" },
      { code: 'EXTERNAL_REFERENCE_NOT_FOUND', message: "Can't resolve external reference: person" },
      { code: 'EXTERNAL_REFERENCE_NOT_FOUND', message: "Can't resolve external reference: address" },
    ])
    expect(result.schema).toHaveProperty(['properties', 'name', 'properties', 'last'], {
      ...specification.$defs.nonEmptyString,
      description: "The person's last name",
    })
    expect(result.schema).toHaveProperty(['properties', 'schoolAddress'], {
      ...specification.$defs.address,
      description: "The person's school address",
    })
    expect(specification.properties.name.properties.last.$ref).toBe('#/$defs/nonEmptyString')
  })
})
