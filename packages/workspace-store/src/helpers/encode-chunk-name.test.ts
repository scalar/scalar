import { win32 } from 'node:path'

import { describe, expect, it } from 'vitest'

import { encodeChunkName } from './encode-chunk-name'

describe('encode-chunk-name', () => {
  it.each([
    '..\\..\\outside',
    '../outside',
    'C:\\outside',
    '\\\\server\\share',
    '..',
    '.',
    '',
    'name:stream',
    'name#fragment',
    'name%2fpath',
  ])('keeps %s inside a Windows directory', (name) => {
    const encoded = encodeChunkName(name)
    const root = 'C:\\public\\chunks'

    expect(win32.dirname(win32.resolve(root, `${encoded}.json`))).toBe(root)
    expect(encoded).not.toMatch(/[\\/:*?"<>|#%]/)
    expect(encoded === '' || encoded === '.' || encoded === '..').toBe(false)
  })

  it('preserves normal JSON Pointer filenames', () => {
    expect(encodeChunkName('/users/{id}')).toBe('~1users~1{id}')
    expect(encodeChunkName('User')).toBe('User')
  })

  it('keeps escaped names distinct from literal escape sequences', () => {
    expect(encodeChunkName('\\')).toBe('~x5c~')
    expect(encodeChunkName('~x5c~')).toBe('~0x5c~0')
  })

  it.each(['CON', 'NUL.txt', 'aux', 'com1', 'LPT9', 'name.'])('avoids Windows reserved filename %s', (name) => {
    expect(encodeChunkName(name)).not.toBe(name)
    expect(encodeChunkName(name).endsWith('.')).toBe(false)
  })
})
