import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { assert, describe, expect, it, vi } from 'vitest'

import { readFile, readFiles } from '.'

describe('readFile', () => {
  it('reads a confined code file as text without weakening path restrictions', async () => {
    const source = 'const value = {\r\n  text: "hello",\r\n};\r\n'
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-text-loader-'))
    try {
      const file = path.join(directory, 'sample.js')
      await fs.writeFile(file, source)
      expect(await readFiles({ basePath: directory }).exec(file, { parseAs: 'text' })).toStrictEqual({
        ok: true,
        data: source,
        raw: source,
      })
      expect(
        await readFiles({ basePath: path.join(directory, 'nested') }).exec(file, { parseAs: 'text' }),
      ).toStrictEqual({ ok: false })
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })

  it('reads file URLs inside the base path and rejects URLs that resolve outside it', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar file URL-'))
    const basePath = path.join(directory, 'approved')
    const inside = path.join(basePath, 'sample.json')
    const outside = path.join(directory, 'outside.json')
    const link = path.join(basePath, 'link.json')
    const contents = '{"message":"ok"}'
    try {
      await fs.mkdir(basePath)
      await fs.writeFile(inside, contents)
      await fs.writeFile(outside, contents)
      await fs.symlink(outside, link)
      const loader = readFiles({ basePath })

      const localUrl = pathToFileURL(inside).href
      for (const file of [localUrl, localUrl.replace('file:///', 'file://localhost/')]) {
        expect(await loader.exec(file)).toStrictEqual({
          ok: true,
          data: { message: 'ok' },
          raw: contents,
        })
      }
      expect(await loader.exec(pathToFileURL(outside).href)).toStrictEqual({ ok: false })
      expect(await loader.exec(pathToFileURL(link).href)).toStrictEqual({ ok: false })
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })

  it.runIf(path.sep === '/')('checks POSIX backslashes as literal filename characters', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-posix-files-'))
    const basePath = path.join(directory, 'approved')
    const inside = path.join(basePath, 'inside\\schema.json')
    const outside = path.join(directory, 'approved\\schema.json')
    const contents = '{"type":"string"}'
    try {
      await fs.mkdir(basePath)
      await fs.writeFile(inside, contents)
      await fs.writeFile(outside, contents)
      const loader = readFiles({ basePath })

      for (const file of [inside, pathToFileURL(inside).href]) {
        expect(await loader.exec(file)).toStrictEqual({ ok: true, data: { type: 'string' }, raw: contents })
      }
      for (const file of [outside, pathToFileURL(outside).href]) {
        expect(await loader.exec(file)).toStrictEqual({ ok: false })
      }
    } finally {
      await fs.rm(directory, { recursive: true, force: true })
    }
  })

  it.each([
    'file://files.example.invalid/share/schema.json',
    '\\\\files.example.invalid\\share\\schema.json',
    '//files.example.invalid/share/schema.json',
    '\\\\?\\UNC\\files.example.invalid\\share\\schema.json',
  ])('rejects Windows network file references before filesystem access (%s)', async (file) => {
    // Exercise Node's Windows path semantics on any CI host.
    vi.doMock('node:path', async (importOriginal) => {
      const nativePath = await importOriginal<typeof import('node:path')>()
      return { ...nativePath, ...nativePath.win32 }
    })

    // Block filesystem calls even if the guard regresses so this test cannot contact a network share.
    const realpath = vi.spyOn(fs, 'realpath').mockRejectedValue(new Error('Unexpected filesystem access'))
    const read = vi.spyOn(fs, 'readFile').mockRejectedValue(new Error('Unexpected filesystem access'))
    try {
      expect(await readFiles({ basePath: 'C:\\approved' }).exec(file)).toStrictEqual({ ok: false })
      expect(realpath).not.toHaveBeenCalled()
      expect(read).not.toHaveBeenCalled()
    } finally {
      realpath.mockRestore()
      read.mockRestore()
      vi.doUnmock('node:path')
    }
  })

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

  it.each([undefined, 'text'] as const)('refuses a symlink escape with parseAs=%s', async (parseAs) => {
    const os = await import('node:os')
    const path = await import('node:path')

    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-readfiles-'))
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'scalar-secret-'))

    try {
      await fs.writeFile(path.join(outside, 'secret.json'), JSON.stringify({ secret: true }))

      // A symlink that lives inside the base directory but resolves to a file outside it.
      const link = path.join(base, 'link.json')
      await fs.symlink(path.join(outside, 'secret.json'), link)

      expect(await readFiles({ basePath: base }).exec(link, { parseAs })).toStrictEqual({ ok: false })
    } finally {
      await fs.rm(base, { recursive: true, force: true })
      await fs.rm(outside, { recursive: true, force: true })
    }
  })
})
