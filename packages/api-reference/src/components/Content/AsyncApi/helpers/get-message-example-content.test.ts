import { describe, expect, it } from 'vitest'

import { getMessageExampleContent } from './get-message-example-content'

describe('get-message-example-content', () => {
  it.each([
    [{ payload: { id: 1 } }, '{\n  "id": 1\n}'],
    [{ headers: { trace: 'abc' } }, '{\n  "trace": "abc"\n}'],
    [
      { headers: { trace: 'abc' }, payload: false },
      '{\n  "headers": {\n    "trace": "abc"\n  },\n  "payload": false\n}',
    ],
    [{ payload: null }, 'null'],
    [{ payload: false }, 'false'],
    [{ payload: 0 }, '0'],
    [{ payload: '' }, ''],
    [{ payload: 'hello' }, 'hello'],
    [{ payload: [1, 2] }, '[\n  1,\n  2\n]'],
    [{}, undefined],
  ])('formats %j as %s', (example, expected) => {
    expect(getMessageExampleContent(example)).toBe(expected)
  })

  it('formats recursive payloads without throwing', () => {
    const payload: Record<string, unknown> = { id: 1 }
    payload.self = payload
    expect(getMessageExampleContent({ payload })).toBe('{\n  "id": 1,\n  "self": "[Circular]"\n}')
  })
})
