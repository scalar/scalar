import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { load, validate } from '../../../../src'
import { readFiles } from '../../../../src/plugins/read-files/readFiles'

const EXAMPLE_FILE = path.join(
  new URL(import.meta.url).pathname,
  '../../pass/externalPathItemRef.yaml',
)

describe('externalPathItemRef', () => {
  // TODO: We don’t want this behaviour in the new parser.
  it.skip('passes', async () => {
    const { filesystem } = await load(EXAMPLE_FILE, {
      plugins: [readFiles()],
    })

    const { schema } = await validate(filesystem)

    expect(schema.paths['/test'].get).not.toBeUndefined()
    expect(schema.paths['/test'].get).toMatchObject({
      responses: {
        '200': {
          description: 'OK',
        },
      },
    })
  })
})
