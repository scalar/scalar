import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { createMockServer } from '../create-mock-server'
import { processOpenApiDocument } from './process-openapi-document'

describe('processOpenApiDocument', () => {
  it('does not request loopback URLs through a $ref', async () => {
    const requests: string[] = []
    const server = createServer((request, response) => {
      requests.push(request.url ?? '')
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ secret: 'internal-service-secret' }))
    })

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })

    try {
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a TCP server address')
      }

      const document = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: { schemas: { Leaked: { $ref: `http://127.0.0.1:${address.port}/secret.json` } } },
      }

      const result = await processOpenApiDocument(document)

      expect(requests).toStrictEqual([])
      expect(JSON.stringify(result)).not.toContain('internal-service-secret')
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
    }
  })

  it.each(['object', 'json', 'yaml'] as const)(
    'does not read local files from an inline %s description by default',
    async (format) => {
      const directory = await mkdtemp(join(process.cwd(), '.scalar-inline-files-'))
      const file = join(directory, 'fixture.json')
      await writeFile(file, JSON.stringify({ type: 'string', description: 'local-fixture-marker' }))
      try {
        const document = {
          openapi: '3.1.0',
          info: { title: 'Test', version: '1' },
          paths: {},
          components: { schemas: { Example: { $ref: file } } },
        }
        const inputs = {
          json: JSON.stringify(document),
          yaml: `openapi: 3.1.0\ninfo: {title: Test, version: '1'}\npaths: {}\ncomponents:\n  schemas:\n    Example:\n      $ref: ${file}`,
          object: document,
        }
        const input = inputs[format]
        const result = await processOpenApiDocument(input)
        expect(JSON.stringify(result)).not.toContain('local-fixture-marker')
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    },
  )

  it('resolves permitted relative file references in an inline description', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-allowed-files-'))
    await writeFile(
      join(directory, 'fixture.json'),
      JSON.stringify({ type: 'string', description: 'permitted-fixture-marker' }),
    )
    try {
      const result = await processOpenApiDocument(
        {
          openapi: '3.1.0',
          info: { title: 'Test', version: '1' },
          paths: {},
          components: { schemas: { Example: { $ref: './fixture.json' } } },
        },
        { fileReferences: { basePath: directory } },
      )
      expect(JSON.stringify(result)).toContain('permitted-fixture-marker')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('uses file-reference permissions from the public mock-server options', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-public-file-options-'))
    await writeFile(join(directory, 'fixture.json'), JSON.stringify({ type: 'string', const: 'permitted-response' }))
    try {
      const app = await createMockServer({
        logger: false,
        fileReferences: { basePath: directory },
        document: {
          openapi: '3.1.0',
          info: { title: 'Test', version: '1' },
          paths: {
            '/value': {
              get: {
                responses: {
                  '200': { description: 'OK', content: { 'application/json': { schema: { $ref: './fixture.json' } } } },
                },
              },
            },
          },
        },
      })
      const response = await app.request('/value')
      expect(response.status).toBe(200)
      expect(await response.json()).toBe('permitted-response')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('keeps local file inputs scoped to their own directory', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-local-files-'))
    await writeFile(
      join(directory, 'fixture.json'),
      JSON.stringify({ type: 'string', description: 'permitted-local-marker' }),
    )
    const document = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1' },
      paths: {},
      components: { schemas: { Example: { $ref: './fixture.json' } } },
    }
    const input = join(directory, 'api.json')
    await writeFile(input, JSON.stringify(document))
    try {
      const result = await processOpenApiDocument(input)
      expect(JSON.stringify(result)).toContain('permitted-local-marker')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('rejects symlinks and traversal outside an explicitly permitted directory', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'scalar-confined-files-'))
    const allowed = join(directory, 'allowed')
    await mkdir(allowed)
    await writeFile(
      join(directory, 'outside.json'),
      JSON.stringify({ type: 'string', description: 'outside-fixture-marker' }),
    )
    await symlink(join(directory, 'outside.json'), join(allowed, 'link.json'))
    try {
      const result = await processOpenApiDocument(
        {
          openapi: '3.1.0',
          info: { title: 'Test', version: '1' },
          paths: {},
          components: { schemas: { Traversal: { $ref: '../outside.json' }, Symlink: { $ref: './link.json' } } },
        },
        { fileReferences: { basePath: allowed } },
      )
      expect(JSON.stringify(result)).not.toContain('outside-fixture-marker')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('does not read files outside the working directory through a $ref', async () => {
    const secretDir = await mkdtemp(join(tmpdir(), 'scalar-mock-secret-'))
    const secretFile = join(secretDir, 'secret.json')
    await writeFile(secretFile, JSON.stringify({ secret: 'do-not-leak' }))

    try {
      const document = {
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: { schemas: { Leaked: { $ref: secretFile } } },
      }

      const result = await processOpenApiDocument(document)

      // The out-of-tree file must not be inlined into the bundled document.
      expect(JSON.stringify(result)).not.toContain('do-not-leak')
    } finally {
      await rm(secretDir, { recursive: true, force: true })
    }
  })
})
