import { describe, expect, it } from 'vitest'

import { javaBody, quoteJava } from './java'

describe('java', () => {
  it('escapes quotes, backslashes, controls, and literal unicode escapes independently', () => {
    expect(quoteJava('"\\\n\r\t\0\x01\\u0000')).toBe('"\\"\\\\\\n\\r\\t\\000\\001\\\\u0000"')
  })

  it('preserves unicode text', () => {
    expect(quoteJava('日本語 café 🦄')).toBe('"日本語 café 🦄"')
  })

  it('reads file contents without converting binary bytes to text', () => {
    expect(javaBody([{ text: 'begin\r\n' }, { file: 'photo.png' }, { text: '\r\nend' }])).toStrictEqual([
      'java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();',
      'body.write("begin\\r\\n".getBytes(java.nio.charset.StandardCharsets.UTF_8));',
      'body.write(java.nio.file.Files.readAllBytes(java.nio.file.Path.of("photo.png")));',
      'body.write("\\r\\nend".getBytes(java.nio.charset.StandardCharsets.UTF_8));',
      '',
    ])
  })
})
