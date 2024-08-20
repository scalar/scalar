import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { load, validate } from '../../../../src'
import { readFiles } from '../../../../src/utils/load/plugins/readFiles'
import { downloadFile } from '../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) => `openapi3-examples/3.0/${filename}`

const EXAMPLE_FILE = path.join(
  new URL(import.meta.url).pathname,
  '../../pass/externalPathItemRef.yaml',
)

const INCLUDE_FILE = path.join(
  new URL(import.meta.url).pathname,
  '../../resources/include.yaml',
)

describe('externalPathItemRef', () => {
  it('passes', async () => {
    await downloadFile(
      bucketName,
      filePath('pass/externalPathItemRef.yaml'),
      EXAMPLE_FILE,
    )

    await downloadFile(
      bucketName,
      filePath('resources/include.yaml'),
      INCLUDE_FILE,
    )

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
