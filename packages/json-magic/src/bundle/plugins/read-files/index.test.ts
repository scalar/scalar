import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'

import { assert, describe, expect, it } from 'vitest'

import { readFile } from '.'

describe('readFile', () => {
  it('reads json contents of a file', async () => {
    const contents = { message: 'ok' }
    const path = randomUUID()
    await fs.writeFile(path, JSON.stringify(contents))

    const result = await readFile(path)
    await fs.rm(path)

    expect(result.ok).toBe(true)
    assert(result.ok === true)

    expect(result.data).toEqual(contents)
  })

  it('reads yml contents of a file', async () => {
    const contents = 'a: a'
    const path = randomUUID()
    await fs.writeFile(path, contents)

    const result = await readFile(path)
    await fs.rm(path)

    expect(result.ok).toBe(true)
    assert(result.ok === true)

    expect(result.data).toEqual({ a: 'a' })
  })

  it('refuses to read files outside the base path', async () => {
    const os = await import('node:os')
    const path = await import('node:path')

    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-readfiles-'))
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-secret-'))

    try {
      await fs.writeFile(path.join(base, 'ok.json'), JSON.stringify({ ok: true }))
      await fs.writeFile(path.join(outside, 'secret.json'), JSON.stringify({ secret: true }))

      // A file inside the base path still reads.
      expect((await readFile(path.join(base, 'ok.json'), base)).ok).toBe(true)

      // A file outside the base path is refused, even though it exists and parses.
      expect((await readFile(path.join(outside, 'secret.json'), base)).ok).toBe(false)
    } finally {
      await fs.rm(base, { recursive: true, force: true })
      await fs.rm(outside, { recursive: true, force: true })
    }
  })
})
