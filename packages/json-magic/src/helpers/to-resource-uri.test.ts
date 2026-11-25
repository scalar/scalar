import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { describe, expect, it, vi } from 'vitest'

import { toResourceUri } from './to-resource-uri'

describe('to-resource-uri', () => {
  it('retains literal backslashes in relative POSIX paths and the working directory', () => {
    const currentDirectory = vi.spyOn(process, 'cwd').mockReturnValue(String.raw`/tmp/current\dir`)
    try {
      const source = String.raw`./source\dir/root.json`
      expect(toResourceUri(source)).toBe(pathToFileURL(path.posix.resolve(source), { windows: false }).href)
    } finally {
      currentDirectory.mockRestore()
    }
  })
  it.each([String.raw`.\source dir\Pet.json`, './schemas/Pet.json', String.raw`\root.json`, '/root.json'])(
    'resolves %s from a Windows working directory',
    (source) => {
      const currentDirectory = vi.spyOn(process, 'cwd').mockReturnValue('C:\\working directory')
      try {
        expect(toResourceUri(source)).toBe(pathToFileURL(source, { windows: true }).href)
      } finally {
        currentDirectory.mockRestore()
      }
    },
  )

  it('retains literal backslashes in absolute POSIX paths', () => {
    const source = String.raw`/tmp/source\dir/root.json`
    expect(toResourceUri(source)).toBe(pathToFileURL(source, { windows: false }).href)
  })

  it.each([
    String.raw`\\server\share\source dir\schema#1%.json`,
    String.raw`\\?\C:\source dir\root.json`,
    String.raw`\\?\UNC\server\share\root.json`,
  ])('round-trips %s with Windows filesystem semantics', (source) => {
    const expected = pathToFileURL(source, { windows: true })
    const uri = toResourceUri(source)
    expect(uri).toBe(expected.href)
    expect(fileURLToPath(uri, { windows: true })).toBe(fileURLToPath(expected, { windows: true }))
  })

  it.each([
    ['/tmp/source dir/schema#1%.json', 'file:///tmp/source%20dir/schema%231%25.json'],
    ['C:\\schemas\\pet.json', 'file:///C:/schemas/pet.json'],
    ['file:///tmp/schema.json', 'file:///tmp/schema.json'],
    ['https://example.test/schema.json', 'https://example.test/schema.json'],
    ['urn:example:schema', 'urn:example:schema'],
  ])('converts %s to %s', (source, expected) => {
    expect(toResourceUri(source)).toBe(expected)
  })
  it('canonicalizes relative retrieval paths against the working directory', () => {
    expect(toResourceUri('./schemas/Pet.json')).toBe(pathToFileURL(path.resolve('./schemas/Pet.json')).href)
  })
})
