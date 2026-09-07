import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { processAsyncApiDocument } from './process-asyncapi-document'

describe('processAsyncApiDocument', () => {
  it('does not read files outside the working directory through a $ref', async () => {
    const secretDir = await mkdtemp(join(tmpdir(), 'scalar-mock-asyncapi-secret-'))
    const secretFile = join(secretDir, 'secret.json')
    await writeFile(secretFile, JSON.stringify({ secret: 'do-not-leak' }))

    try {
      const document = {
        asyncapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        channels: {},
        operations: {},
        components: { schemas: { Leaked: { $ref: secretFile } } },
      }

      const result = await processAsyncApiDocument(document)

      // The out-of-tree file must not be inlined into the bundled document.
      expect(JSON.stringify(result)).not.toContain('do-not-leak')
    } finally {
      await rm(secretDir, { recursive: true, force: true })
    }
  })

  it('does not fetch private network addresses through a $ref', async () => {
    const document = {
      asyncapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      channels: {},
      operations: {},
      // The cloud metadata endpoint is a classic SSRF target; it must never be fetched and inlined.
      components: { schemas: { Leaked: { $ref: 'http://169.254.169.254/latest/meta-data/' } } },
    }

    const result = await processAsyncApiDocument(document)

    // The $ref must stay unresolved rather than the private address being fetched and inlined.
    expect(JSON.stringify(result)).toContain('169.254.169.254')
    expect(JSON.stringify(result)).toContain('$ref')
  })
})
