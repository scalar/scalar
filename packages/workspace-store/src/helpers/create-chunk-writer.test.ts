import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { createChunkWriter } from './create-chunk-writer'

describe('create-chunk-writer', () => {
  it('rejects paths outside the output root before creating directories or files', async () => {
    const fixture = await fs.mkdtemp(join(tmpdir(), 'scalar-chunk-boundary-'))
    const directory = join(fixture, 'output')

    try {
      const writeChunk = await createChunkWriter(directory)

      await expect(writeChunk(['..', 'outside', 'marker.json'], {})).rejects.toThrow(
        'Chunk path must stay inside the output directory',
      )
      await expect(writeChunk([join(fixture, 'absolute', 'marker.json')], {})).rejects.toThrow(
        'Chunk path must stay inside the output directory',
      )
      expect(await fs.readdir(fixture)).toStrictEqual(['output'])
      expect(await fs.readdir(directory)).toStrictEqual([])
    } finally {
      await fs.rm(fixture, { recursive: true, force: true })
    }
  })
})
