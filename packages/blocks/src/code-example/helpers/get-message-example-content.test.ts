import { describe, expect, it } from 'vitest'

import { getMessageExampleContent } from './get-message-example-content'

describe('get-message-example-content', () => {
  it.each([
    [{ id: 1 }, '{\n  "id": 1\n}'],
    [null, 'null'],
    [false, 'false'],
    [0, '0'],
    ['', ''],
    ['hello', 'hello'],
    [[1, 2], '[\n  1,\n  2\n]'],
  ])('preserves the existing JSON representation of %j', (value, content) => {
    expect(getMessageExampleContent(value)).toStrictEqual({ content, lang: 'json', structural: false })
  })

  it.each(['application/json', 'Application/Problem+Json; charset=utf-8'])('formats %s as JSON', (contentType) => {
    expect(getMessageExampleContent('{"id":1}', contentType)).toStrictEqual({
      content: '{\n  "id": 1\n}',
      lang: 'json',
      structural: false,
    })
  })

  it.each([
    ['text/plain', 'plaintext'],
    ['application/octet-stream', 'plaintext'],
    ['invalid', 'plaintext'],
    ['text/xml', 'xml'],
    ['application/event+xml; charset=utf-8', 'xml'],
    ['application/yaml', 'yaml'],
    ['application/x-yaml', 'yaml'],
    ['application/event+yaml', 'yaml'],
  ])('preserves authored text for %s', (contentType, lang) => {
    const content = '  {"id":1}\n'
    expect(getMessageExampleContent(content, contentType)).toStrictEqual({ content, lang, structural: false })
  })

  it('identifies structured non-JSON data without inventing an encoding', () => {
    expect(getMessageExampleContent({ id: 1 }, 'application/xml')).toStrictEqual({
      content: '{\n  "id": 1\n}',
      lang: 'json',
      structural: true,
    })
  })

  it('omits absent content', () => {
    expect(getMessageExampleContent(undefined)).toBeUndefined()
  })

  it('formats recursive payloads without throwing', () => {
    const payload: Record<string, unknown> = { id: 1 }
    payload.self = payload
    expect(getMessageExampleContent(payload)).toStrictEqual({
      content: '{\n  "id": 1,\n  "self": "[Circular]"\n}',
      lang: 'json',
      structural: false,
    })
  })
})
